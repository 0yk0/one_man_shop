package com.wails.app;

import android.app.Activity;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbDeviceConnection;
import android.hardware.usb.UsbEndpoint;
import android.hardware.usb.UsbInterface;
import android.hardware.usb.UsbManager;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.webkit.WebView;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

/**
 * PrinterBridge provides Bluetooth and USB thermal printer support for Android.
 * Exposed to JavaScript as window._printerBridge via addJavascriptInterface.
 *
 * Flow: Frontend calls Go BuildEscposBytes() → gets base64 → calls print(base64) → sends to printer.
 */
public class PrinterBridge {
    private static final String TAG = "PrinterBridge";
    private static final String PREFS_NAME = "printer_prefs";
    private static final String KEY_LAST_TYPE = "last_printer_type";
    private static final String KEY_LAST_ID = "last_printer_id";
    private static final String KEY_LAST_NAME = "last_printer_name";

    // SPP UUID for Bluetooth Serial Port Profile
    private static final UUID SPP_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");

    // Known thermal printer USB vendor IDs
    private static final int[] THERMAL_VENDOR_IDS = {
        0x0416, // Npson
        0x0FE6, // ISSC / IC Thermal
        0x1FC9, // NXP (used in some printers)
        0x0456, // Analog Devices
        0x04B8, // Seiko Epson
        0x0127, // IT (Interface Technology)
        0x03F3, // Generic
        0x2109, // VIA Labs
    };

    private static final int USB_TIMEOUT_MS = 30000;
    private static final int BT_CONNECT_TIMEOUT_MS = 10000;

    private final Activity activity;
    private final WebView webView;
    private final Handler mainHandler;
    private final ExecutorService executor;
    private final SharedPreferences prefs;

    // Connection state
    private String connectionType = null; // "bluetooth" or "usb"
    private boolean connected = false;
    private OutputStream outputStream;
    private InputStream inputStream;
    private BluetoothSocket bluetoothSocket;
    private BluetoothAdapter bluetoothAdapter;
    private UsbDeviceConnection usbConnection;
    private UsbEndpoint usbEndpoint;

    // USB permission
    private static final String ACTION_USB_PERMISSION = "com.wails.app.USB_PERMISSION";
    private boolean usbPermissionPending = false;

    // Broadcast receivers
    private final BroadcastReceiver usbDetachReceiver;
    private final BroadcastReceiver btDisconnectReceiver;
    private boolean receiversRegistered = false;

    public PrinterBridge(Activity activity) {
        this.activity = activity;
        this.webView = activity.findViewById(R.id.webview);
        this.mainHandler = new Handler(Looper.getMainLooper());
        this.executor = Executors.newSingleThreadExecutor();
        this.prefs = activity.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        this.bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();

        // USB detach receiver
        usbDetachReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (UsbManager.ACTION_USB_DEVICE_DETACHED.equals(intent.getAction())) {
                    Log.i(TAG, "USB device detached");
                    handleDisconnect();
                }
            }
        };

        // Bluetooth disconnect receiver
        btDisconnectReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (BluetoothDevice.ACTION_ACL_DISCONNECTED.equals(intent.getAction())) {
                    BluetoothDevice device = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
                    if (device != null && bluetoothSocket != null) {
                        BluetoothDevice remoteDevice = bluetoothSocket.getRemoteDevice();
                        if (device.getAddress().equals(remoteDevice.getAddress())) {
                            Log.i(TAG, "Bluetooth device disconnected: " + device.getAddress());
                            handleDisconnect();
                        }
                    }
                }
            }
        };
    }

    // ========== Public methods exposed to JavaScript ==========

    /**
     * Get list of paired Bluetooth printers.
     * Returns JSON array: [{name: "TM-T20", address: "AA:BB:CC:DD:EE:FF"}]
     * Requests BLUETOOTH_CONNECT permission on Android 12+ if not granted.
     */
    @android.webkit.JavascriptInterface
    public String getBluetoothPrinters() {
        JSONArray result = new JSONArray();

        if (bluetoothAdapter == null) {
            Log.w(TAG, "Bluetooth not supported on this device");
            return result.toString();
        }

        // Check Bluetooth permission on Android 12+
        if (Build.VERSION.SDK_INT >= 31) {
            if (activity.checkSelfPermission(android.Manifest.permission.BLUETOOTH_CONNECT)
                    != PackageManager.PERMISSION_GRANTED) {
                Log.w(TAG, "BLUETOOTH_CONNECT permission not granted, requesting...");
                activity.runOnUiThread(() ->
                    activity.requestPermissions(
                        new String[]{android.Manifest.permission.BLUETOOTH_CONNECT},
                        1001
                    )
                );
                return result.toString();
            }
        }

        Set<BluetoothDevice> pairedDevices = bluetoothAdapter.getBondedDevices();
        if (pairedDevices != null) {
            for (BluetoothDevice device : pairedDevices) {
                try {
                    JSONObject obj = new JSONObject();
                    obj.put("name", device.getName());
                    obj.put("address", device.getAddress());
                    result.put(obj);
                } catch (Exception e) {
                    Log.e(TAG, "Error reading BT device", e);
                }
            }
        }

        Log.d(TAG, "Found " + result.length() + " paired Bluetooth devices");
        return result.toString();
    }

    /**
     * Get list of connected USB printers.
     * Returns JSON array: [{name: "TM-T20", id: 1, vendorId: 1176, productId: 2049}]
     */
    @android.webkit.JavascriptInterface
    public String getUsbPrinters() {
        JSONArray result = new JSONArray();

        UsbManager usbManager = (UsbManager) activity.getSystemService(Context.USB_SERVICE);
        if (usbManager == null) {
            Log.w(TAG, "USB service not available");
            return result.toString();
        }

        // Check USB host support
        if (!activity.getPackageManager().hasSystemFeature(PackageManager.FEATURE_USB_HOST)) {
            Log.w(TAG, "USB host not supported on this device");
            return result.toString();
        }

        HashMap<String, UsbDevice> deviceList = usbManager.getDeviceList();
        for (UsbDevice device : deviceList.values()) {
            if (isThermalPrinter(device)) {
                try {
                    JSONObject obj = new JSONObject();
                    obj.put("name", device.getDeviceName());
                    obj.put("id", device.getDeviceId());
                    obj.put("vendorId", device.getVendorId());
                    obj.put("productId", device.getProductId());
                    obj.put("productName", getUsbDeviceName(device));
                    result.put(obj);
                } catch (Exception e) {
                    Log.e(TAG, "Error reading USB device", e);
                }
            }
        }

        Log.d(TAG, "Found " + result.length() + " USB printer devices");
        return result.toString();
    }

    /**
     * Connect to a Bluetooth printer.
     * @param address Bluetooth MAC address (e.g., "AA:BB:CC:DD:EE:FF")
     */
    @android.webkit.JavascriptInterface
    public String connectBluetooth(String address) {
        if (bluetoothAdapter == null) {
            throw new RuntimeException("Bluetooth not supported");
        }

        // Check permission on Android 12+
        if (Build.VERSION.SDK_INT >= 31) {
            if (activity.checkSelfPermission(android.Manifest.permission.BLUETOOTH_CONNECT)
                    != PackageManager.PERMISSION_GRANTED) {
                throw new RuntimeException("Bluetooth permission not granted");
            }
        }

        // Disconnect existing connection
        disconnectInternal();

        try {
            BluetoothDevice device = bluetoothAdapter.getRemoteDevice(address);
            if (device == null) {
                throw new RuntimeException("Device not found: " + address);
            }

            bluetoothSocket = device.createRfcommSocketToServiceRecord(SPP_UUID);
            bluetoothSocket.connect();

            outputStream = bluetoothSocket.getOutputStream();
            inputStream = bluetoothSocket.getInputStream();
            connectionType = "bluetooth";
            connected = true;

            // Save for auto-reconnect
            prefs.edit()
                .putString(KEY_LAST_TYPE, "bluetooth")
                .putString(KEY_LAST_ID, address)
                .putString(KEY_LAST_NAME, device.getName() != null ? device.getName() : address)
                .apply();

            registerReceivers();
            Log.i(TAG, "Connected to Bluetooth printer: " + address);
            return "ok";

        } catch (IOException e) {
            disconnectInternal();
            throw new RuntimeException("Bluetooth connection failed: " + e.getMessage());
        }
    }

    /**
     * Connect to a USB printer.
     * Shows system permission dialog if needed.
     * @param deviceId Android USB device ID
     */
    @android.webkit.JavascriptInterface
    public String connectUsb(int deviceId) {
        UsbManager usbManager = (UsbManager) activity.getSystemService(Context.USB_SERVICE);
        if (usbManager == null) {
            throw new RuntimeException("USB service not available");
        }

        // Disconnect existing connection
        disconnectInternal();

        // Find the device
        UsbDevice targetDevice = null;
        for (UsbDevice device : usbManager.getDeviceList().values()) {
            if (device.getDeviceId() == deviceId) {
                targetDevice = device;
                break;
            }
        }
        if (targetDevice == null) {
            throw new RuntimeException("USB device not found: " + deviceId);
        }

        // Check if we already have permission
        if (usbManager.hasPermission(targetDevice)) {
            return connectUsbInternal(usbManager, targetDevice);
        }

        // Request permission via system dialog
        usbPermissionPending = true;
        android.app.PendingIntent permissionIntent = android.app.PendingIntent.getBroadcast(
            activity, 0, new Intent(ACTION_USB_PERMISSION),
            android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE
        );

        // Register a one-time receiver for the permission result
        BroadcastReceiver permissionReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (ACTION_USB_PERMISSION.equals(intent.getAction())) {
                    usbPermissionPending = false;
                    activity.unregisterReceiver(this);

                    UsbDevice device = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);
                    boolean granted = intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false);

                    if (granted && device != null) {
                        mainHandler.post(() -> {
                            try {
                                connectUsbInternal(usbManager, device);
                                notifyFrontend("onConnect", "usb");
                            } catch (Exception e) {
                                notifyError("USB connection failed: " + e.getMessage());
                            }
                        });
                    } else {
                        notifyError("USB permission denied");
                    }
                }
            }
        };

        activity.registerReceiver(permissionReceiver,
            new IntentFilter(ACTION_USB_PERMISSION), Context.RECEIVER_NOT_EXPORTED);

        usbManager.requestPermission(targetDevice, permissionIntent);
        Log.d(TAG, "USB permission requested for device: " + deviceId);

        // Set a timeout for the permission dialog
        mainHandler.postDelayed(() -> {
            if (usbPermissionPending) {
                usbPermissionPending = false;
                try {
                    activity.unregisterReceiver(permissionReceiver);
                } catch (Exception ignored) {}
                notifyError("USB permission timed out");
            }
        }, USB_TIMEOUT_MS);

        return "permission_pending";
    }

    /**
     * Internal USB connection logic (must run on background thread).
     */
    private String connectUsbInternal(UsbManager usbManager, UsbDevice device) {
        UsbDeviceConnection connection = usbManager.openDevice(device);
        if (connection == null) {
            throw new RuntimeException("Failed to open USB device");
        }

        UsbInterface usbInterface = device.getInterface(0);
        UsbEndpoint endpoint = null;

        // Find bulk OUT endpoint
        for (int i = 0; i < usbInterface.getEndpointCount(); i++) {
            UsbEndpoint ep = usbInterface.getEndpoint(i);
            if (ep.getType() == android.hardware.usb.UsbConstants.USB_ENDPOINT_XFER_BULK
                    && ep.getDirection() == android.hardware.usb.UsbConstants.USB_DIR_OUT) {
                endpoint = ep;
                break;
            }
        }

        if (endpoint == null) {
            connection.close();
            throw new RuntimeException("No bulk OUT endpoint found");
        }

        if (!connection.claimInterface(usbInterface, true)) {
            connection.close();
            throw new RuntimeException("Failed to claim USB interface");
        }

        usbConnection = connection;
        usbEndpoint = endpoint;
        connectionType = "usb";
        connected = true;

        // Save for auto-reconnect
        prefs.edit()
            .putString(KEY_LAST_TYPE, "usb")
            .putString(KEY_LAST_ID, String.valueOf(device.getDeviceId()))
            .putString(KEY_LAST_NAME, getUsbDeviceName(device))
            .apply();

        registerReceivers();
        Log.i(TAG, "Connected to USB printer: " + device.getDeviceId());
        return "ok";
    }

    /**
     * Disconnect from the current printer.
     */
    @android.webkit.JavascriptInterface
    public void disconnect() {
        disconnectInternal();
        Log.i(TAG, "Printer disconnected");
    }

    /**
     * Send ESC/POS bytes to the connected printer.
     * @param escposBase64 Base64-encoded ESC/POS bytes
     * @return "ok" on success, throws RuntimeException on error
     */
    @android.webkit.JavascriptInterface
    public String print(String escposBase64) {
        if (!connected) {
            throw new RuntimeException("Printer not connected");
        }

        try {
            byte[] data = java.util.Base64.getDecoder().decode(escposBase64);

            if ("usb".equals(connectionType)) {
                // USB: send via bulkTransfer (may need chunking for large payloads)
                printUsb(data);
            } else if ("bluetooth".equals(connectionType)) {
                // Bluetooth: send via OutputStream
                if (outputStream == null) {
                    throw new RuntimeException("Printer not connected");
                }
                synchronized (outputStream) {
                    outputStream.write(data);
                    outputStream.flush();
                }
            } else {
                throw new RuntimeException("Printer not connected");
            }

            Log.d(TAG, "Printed " + data.length + " bytes");
            return "ok";
        } catch (IOException e) {
            Log.e(TAG, "Print failed", e);
            handleDisconnect();
            throw new RuntimeException("Print failed: " + e.getMessage());
        }
    }

    /**
     * Send data to USB printer via bulkTransfer.
     * Handles chunking for payloads larger than the endpoint max packet size.
     */
    private void printUsb(byte[] data) throws IOException {
        if (usbConnection == null || usbEndpoint == null) {
            throw new IOException("USB connection not available");
        }

        int maxPacketSize = usbEndpoint.getMaxPacketSize();
        int offset = 0;

        while (offset < data.length) {
            int chunkSize = Math.min(maxPacketSize, data.length - offset);
            byte[] chunk = new byte[chunkSize];
            System.arraycopy(data, offset, chunk, 0, chunkSize);

            int sent = usbConnection.bulkTransfer(usbEndpoint, chunk, chunk.length, 5000);
            if (sent < 0) {
                throw new IOException("USB bulk transfer failed at offset " + offset);
            }
            offset += sent;
        }
    }

    /**
     * Check if a printer is currently connected.
     */
    @android.webkit.JavascriptInterface
    public boolean isConnected() {
        return connected;
    }

    /**
     * Get the current connection type.
     * @return "bluetooth", "usb", or null
     */
    @android.webkit.JavascriptInterface
    public String getConnectionType() {
        return connectionType;
    }

    /**
     * Get the name of the currently connected printer.
     */
    @android.webkit.JavascriptInterface
    public String getPrinterName() {
        return prefs.getString(KEY_LAST_NAME, "");
    }

    /**
     * Open Android Bluetooth settings so the user can pair a new printer.
     */
    @android.webkit.JavascriptInterface
    public void openBluetoothSettings() {
        activity.runOnUiThread(() -> {
            try {
                Intent intent = new Intent(android.provider.Settings.ACTION_BLUETOOTH_SETTINGS);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                activity.startActivity(intent);
            } catch (Exception e) {
                Log.e(TAG, "Failed to open Bluetooth settings", e);
            }
        });
    }

    /**
     * Send a short test receipt to verify the printer works.
     */
    @android.webkit.JavascriptInterface
    public String testPrint() {
        if (!connected || outputStream == null) {
            throw new RuntimeException("Printer not connected");
        }

        // Build a simple test receipt in ESC/POS using byte array
        java.io.ByteArrayOutputStream buf = new java.io.ByteArrayOutputStream();
        try {
            // ESC @ (initialize)
            buf.write(new byte[]{0x1B, 0x40});
            // ESC a 1 (center)
            buf.write(new byte[]{0x1B, 0x61, 0x01});
            // ESC E 1 (bold on)
            buf.write(new byte[]{0x1B, 0x45, 0x01});
            // GS ! 17 (double size)
            buf.write(new byte[]{0x1D, 0x21, 0x11});
            buf.write("TEST PRINT".getBytes("UTF-8"));
            buf.write(0x0A);
            // GS ! 0 (normal size)
            buf.write(new byte[]{0x1D, 0x21, 0x00});
            // ESC E 0 (bold off)
            buf.write(new byte[]{0x1B, 0x45, 0x00});
            buf.write(0x0A);
            buf.write("Printer is working correctly!".getBytes("UTF-8"));
            buf.write(0x0A);
            buf.write(java.text.SimpleDateFormat.getTimeInstance().format(new java.util.Date()).getBytes("UTF-8"));
            buf.write(0x0A);
            buf.write(new byte[]{0x0A, 0x0A, 0x0A});
            // GS V 1 (partial cut)
            buf.write(new byte[]{0x1D, 0x56, 0x01});
        } catch (IOException e) {
            throw new RuntimeException("Failed to build test receipt", e);
        }

        try {
            byte[] data = buf.toByteArray();

            if ("usb".equals(connectionType)) {
                printUsb(data);
            } else if ("bluetooth".equals(connectionType)) {
                if (outputStream == null) {
                    throw new RuntimeException("Printer not connected");
                }
                synchronized (outputStream) {
                    outputStream.write(data);
                    outputStream.flush();
                }
            } else {
                throw new RuntimeException("Printer not connected");
            }

            Log.d(TAG, "Test print sent (" + data.length + " bytes)");
            return "ok";
        } catch (IOException e) {
            Log.e(TAG, "Test print failed", e);
            handleDisconnect();
            throw new RuntimeException("Test print failed: " + e.getMessage());
        }
    }

    /**
     * Attempt to reconnect to the last used printer.
     * Called from MainActivity.onCreate().
     */
    public void autoReconnect() {
        String type = prefs.getString(KEY_LAST_TYPE, null);
        String id = prefs.getString(KEY_LAST_ID, null);

        if (type == null || id == null) {
            Log.d(TAG, "No last printer saved, skipping auto-reconnect");
            return;
        }

        executor.execute(() -> {
            try {
                if ("bluetooth".equals(type)) {
                    // Check permission first on Android 12+
                    if (Build.VERSION.SDK_INT >= 31) {
                        if (activity.checkSelfPermission(android.Manifest.permission.BLUETOOTH_CONNECT)
                                != PackageManager.PERMISSION_GRANTED) {
                            Log.w(TAG, "BT permission not granted, skipping auto-reconnect");
                            return;
                        }
                    }
                    connectBluetooth(id);
                    Log.i(TAG, "Auto-reconnected to Bluetooth printer: " + id);
                } else if ("usb".equals(type)) {
                    UsbManager usbManager = (UsbManager) activity.getSystemService(Context.USB_SERVICE);
                    if (usbManager == null) return;

                    int deviceId = Integer.parseInt(id);
                    for (UsbDevice device : usbManager.getDeviceList().values()) {
                        if (device.getDeviceId() == deviceId) {
                            if (usbManager.hasPermission(device)) {
                                connectUsbInternal(usbManager, device);
                                Log.i(TAG, "Auto-reconnected to USB printer: " + id);
                            } else {
                                Log.w(TAG, "USB permission not granted for auto-reconnect");
                            }
                            break;
                        }
                    }
                }
            } catch (Exception e) {
                Log.w(TAG, "Auto-reconnect failed: " + e.getMessage());
                // Silent failure - user will see "Disconnected" status
            }
        });
    }

    /**
     * Clean up resources. Called from MainActivity.onDestroy().
     */
    public void destroy() {
        disconnectInternal();
        unregisterReceivers();
        executor.shutdown();
        try {
            executor.awaitTermination(1, TimeUnit.SECONDS);
        } catch (InterruptedException ignored) {}
    }

    // ========== Internal helpers ==========

    private void disconnectInternal() {
        connected = false;
        connectionType = null;

        try {
            if (outputStream != null) {
                outputStream.close();
                outputStream = null;
            }
        } catch (IOException ignored) {}

        try {
            if (inputStream != null) {
                inputStream.close();
                inputStream = null;
            }
        } catch (IOException ignored) {}

        try {
            if (bluetoothSocket != null) {
                bluetoothSocket.close();
                bluetoothSocket = null;
            }
        } catch (IOException ignored) {}

        try {
            if (usbConnection != null) {
                usbConnection.close();
                usbConnection = null;
            }
        } catch (Exception ignored) {}

        usbEndpoint = null;
        unregisterReceivers();
    }

    private void handleDisconnect() {
        boolean wasConnected = connected;
        disconnectInternal();
        if (wasConnected) {
            notifyFrontend("onDisconnect", null);
        }
    }

    private void registerReceivers() {
        if (receiversRegistered) return;
        receiversRegistered = true;

        IntentFilter filter = new IntentFilter();
        filter.addAction(UsbManager.ACTION_USB_DEVICE_DETACHED);
        filter.addAction(BluetoothDevice.ACTION_ACL_DISCONNECTED);
        activity.registerReceiver(usbDetachReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
    }

    private void unregisterReceivers() {
        if (!receiversRegistered) return;
        receiversRegistered = false;

        try {
            activity.unregisterReceiver(usbDetachReceiver);
        } catch (Exception ignored) {}
        try {
            activity.unregisterReceiver(btDisconnectReceiver);
        } catch (Exception ignored) {}
    }

    /**
     * Check if a USB device is likely a thermal printer.
     */
    private boolean isThermalPrinter(UsbDevice device) {
        // Check by USB class (7 = Printer)
        for (int i = 0; i < device.getInterfaceCount(); i++) {
            if (device.getInterface(i).getInterfaceClass() == 7) {
                return true;
            }
        }

        // Check by known vendor IDs
        int vendorId = device.getVendorId();
        for (int vid : THERMAL_VENDOR_IDS) {
            if (vendorId == vid) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get a human-readable name for a USB device.
     */
    private String getUsbDeviceName(UsbDevice device) {
        String productName = device.getProductName();
        if (productName != null && !productName.isEmpty()) {
            return productName;
        }
        return String.format(Locale.US, "USB Device %d", device.getDeviceId());
    }

    /**
     * Notify the frontend of an event via evaluateJavascript.
     */
    private void notifyFrontend(String event, String data) {
        if (webView == null) return;
        String js = String.format(Locale.US,
            "window._printerBridge && window._printerBridge.%s && window._printerBridge.%s('%s')",
            event, event, data != null ? data : "");
        mainHandler.post(() -> webView.evaluateJavascript(js, null));
    }

    /**
     * Notify the frontend of an error.
     */
    private void notifyError(String message) {
        if (webView == null) return;
        String escaped = message.replace("'", "\\'").replace("\n", "\\n");
        String js = String.format(Locale.US,
            "window._printerBridge && window._printerBridge.onError && window._printerBridge.onError('%s')",
            escaped);
        mainHandler.post(() -> webView.evaluateJavascript(js, null));
    }
}
