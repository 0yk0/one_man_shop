package escpos

import (
	"testing"
)

func TestParseEmpty(t *testing.T) {
	p := NewParser()
	receipt := p.Parse([]byte{})
	if len(receipt.Commands) != 0 {
		t.Errorf("expected 0 commands, got %d", len(receipt.Commands))
	}
}

func TestParsePlainText(t *testing.T) {
	p := NewParser()
	receipt := p.Parse([]byte("Hello World"))
	if len(receipt.Commands) != 1 {
		t.Fatalf("expected 1 command, got %d", len(receipt.Commands))
	}
	cmd := receipt.Commands[0]
	if cmd.Type != CmdText || cmd.Content != "Hello World" {
		t.Errorf("expected text 'Hello World', got %+v", cmd)
	}
}

func TestParseLineFeed(t *testing.T) {
	p := NewParser()
	receipt := p.Parse([]byte("Line1\nLine2"))
	if len(receipt.Commands) != 3 {
		t.Fatalf("expected 3 commands (text, linefeed, text), got %d", len(receipt.Commands))
	}
	if receipt.Commands[0].Content != "Line1" {
		t.Errorf("expected 'Line1', got '%s'", receipt.Commands[0].Content)
	}
	if receipt.Commands[1].Type != CmdLineFeed {
		t.Errorf("expected linefeed, got %s", receipt.Commands[1].Type)
	}
	if receipt.Commands[2].Content != "Line2" {
		t.Errorf("expected 'Line2', got '%s'", receipt.Commands[2].Content)
	}
}

func TestParseInitialize(t *testing.T) {
	p := NewParser()
	data := []byte{0x1B, 0x40} // ESC @
	receipt := p.Parse(data)
	if len(receipt.Commands) != 1 {
		t.Fatalf("expected 1 command, got %d", len(receipt.Commands))
	}
	if receipt.Commands[0].Type != CmdInitialize {
		t.Errorf("expected initialize, got %s", receipt.Commands[0].Type)
	}
}

func TestParseBold(t *testing.T) {
	p := NewParser()

	// Bold on
	data := []byte{0x1B, 0x45, 0x01} // ESC E 1
	receipt := p.Parse(data)
	if len(receipt.Commands) != 1 {
		t.Fatalf("expected 1 command, got %d", len(receipt.Commands))
	}
	if receipt.Commands[0].Type != CmdBold || !receipt.Commands[0].Bold {
		t.Errorf("expected bold on, got %+v", receipt.Commands[0])
	}

	// Bold off
	data = []byte{0x1B, 0x45, 0x00} // ESC E 0
	receipt = p.Parse(data)
	if receipt.Commands[0].Type != CmdBold || receipt.Commands[0].Bold {
		t.Errorf("expected bold off, got %+v", receipt.Commands[0])
	}
}

func TestParseAlignment(t *testing.T) {
	p := NewParser()

	tests := []struct {
		name  string
		byte  byte
		align Align
	}{
		{"left", 0x00, AlignLeft},
		{"center", 0x01, AlignCenter},
		{"right", 0x02, AlignRight},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			data := []byte{0x1B, 0x61, tt.byte} // ESC a n
			receipt := p.Parse(data)
			if len(receipt.Commands) != 1 {
				t.Fatalf("expected 1 command, got %d", len(receipt.Commands))
			}
			if receipt.Commands[0].Type != CmdAlign || receipt.Commands[0].Align != tt.align {
				t.Errorf("expected align %d, got %+v", tt.align, receipt.Commands[0])
			}
		})
	}
}

func TestParseCharacterSize(t *testing.T) {
	p := NewParser()

	// Double size: GS ! 0x11 (sizeX=2, sizeY=2)
	data := []byte{0x1D, 0x21, 0x11}
	receipt := p.Parse(data)
	if len(receipt.Commands) != 1 {
		t.Fatalf("expected 1 command, got %d", len(receipt.Commands))
	}
	cmd := receipt.Commands[0]
	if cmd.Type != CmdSize || cmd.SizeX != 2 || cmd.SizeY != 2 {
		t.Errorf("expected size 2x2, got %+v", cmd)
	}

	// Normal size: GS ! 0x00
	data = []byte{0x1D, 0x21, 0x00}
	receipt = p.Parse(data)
	cmd = receipt.Commands[0]
	if cmd.Type != CmdSize || cmd.SizeX != 1 || cmd.SizeY != 1 {
		t.Errorf("expected size 1x1, got %+v", cmd)
	}
}

func TestParseCut(t *testing.T) {
	p := NewParser()

	// Partial cut: GS V 1
	data := []byte{0x1D, 0x56, 0x01}
	receipt := p.Parse(data)
	if len(receipt.Commands) != 1 {
		t.Fatalf("expected 1 command, got %d", len(receipt.Commands))
	}
	if receipt.Commands[0].Type != CmdCut || receipt.Commands[0].CutType != "partial" {
		t.Errorf("expected partial cut, got %+v", receipt.Commands[0])
	}

	// Full cut: GS V 0
	data = []byte{0x1D, 0x56, 0x00}
	receipt = p.Parse(data)
	if receipt.Commands[0].CutType != "full" {
		t.Errorf("expected full cut, got %+v", receipt.Commands[0])
	}
}

func TestParseMixedContent(t *testing.T) {
	p := NewParser()

	// Build a mini receipt: bold "TOTAL" + linefeed + normal text
	var data []byte
	data = append(data, 0x1B, 0x45, 0x01) // Bold on
	data = append(data, []byte("TOTAL")...)
	data = append(data, 0x1B, 0x45, 0x00) // Bold off
	data = append(data, 0x0A)              // LF
	data = append(data, []byte("100.00")...)

	receipt := p.Parse(data)
	if len(receipt.Commands) != 5 {
		t.Fatalf("expected 5 commands (bold, text, bold, linefeed, text), got %d: %+v", len(receipt.Commands), receipt.Commands)
	}

	// Bold on
	if receipt.Commands[0].Type != CmdBold || !receipt.Commands[0].Bold {
		t.Errorf("expected bold on, got %+v", receipt.Commands[0])
	}
	// Text "TOTAL"
	if receipt.Commands[1].Type != CmdText || receipt.Commands[1].Content != "TOTAL" {
		t.Errorf("expected text 'TOTAL', got %+v", receipt.Commands[1])
	}
	// Bold off
	if receipt.Commands[2].Type != CmdBold || receipt.Commands[2].Bold {
		t.Errorf("expected bold off, got %+v", receipt.Commands[2])
	}
	// Linefeed
	if receipt.Commands[3].Type != CmdLineFeed {
		t.Errorf("expected linefeed, got %+v", receipt.Commands[3])
	}
	// Text "100.00"
	if receipt.Commands[4].Type != CmdText || receipt.Commands[4].Content != "100.00" {
		t.Errorf("expected text '100.00', got %+v", receipt.Commands[4])
	}
}

func TestParseIncompleteSequence(t *testing.T) {
	p := NewParser()

	// ESC alone (incomplete) - should be treated as text
	data := []byte{0x1B}
	receipt := p.Parse(data)
	// Should not crash, and should produce some output
	if len(receipt.Commands) == 0 {
		t.Error("expected at least 1 command for incomplete sequence")
	}
}

func TestParseResetsState(t *testing.T) {
	p := NewParser()

	// First parse: set bold
	p.Parse([]byte{0x1B, 0x45, 0x01})

	// Second parse: should reset (no bold)
	receipt := p.Parse([]byte("text"))
	for _, cmd := range receipt.Commands {
		if cmd.Type == CmdBold && cmd.Bold {
			t.Error("expected parser to reset state between Parse calls")
		}
	}
}

func TestParseCarriageReturn(t *testing.T) {
	p := NewParser()
	// CR should be skipped (0x0D)
	data := []byte("Line1\r\nLine2")
	receipt := p.Parse(data)
	// Should have: text "Line1", linefeed, text "Line2"
	if len(receipt.Commands) != 3 {
		t.Fatalf("expected 3 commands, got %d: %+v", len(receipt.Commands), receipt.Commands)
	}
	if receipt.Commands[0].Content != "Line1" {
		t.Errorf("expected 'Line1', got '%s'", receipt.Commands[0].Content)
	}
}
