//go:build windows

package handlers

// getFreeSpace is not supported on Windows — callers should treat
// a returned error as "disk space unknown" and proceed without the check.
func getFreeSpace(path string) (int64, error) {
	return 0, nil
}
