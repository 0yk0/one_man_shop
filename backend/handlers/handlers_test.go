package handlers

import "testing"

func TestNewAppHandler(t *testing.T) {
	handler := NewAppHandler()
	if handler == nil {
		t.Fatal("NewAppHandler returned nil")
	}
}

func TestNewAppHandler_returns_non_nil(t *testing.T) {
	handler := NewAppHandler()
	if handler == (*AppHandler)(nil) {
		t.Error("NewAppHandler returned nil pointer")
	}
}
