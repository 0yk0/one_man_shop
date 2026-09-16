//go:build !windows

package handlers

import "syscall"

// getFreeSpace returns the available disk space in bytes for the given path.
func getFreeSpace(path string) (int64, error) {
	var stat syscall.Statfs_t
	if err := syscall.Statfs(path, &stat); err != nil {
		return 0, err
	}
	return int64(stat.Bavail) * int64(stat.Bsize), nil
}
