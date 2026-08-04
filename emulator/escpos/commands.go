package escpos

// CommandType represents the type of parsed ESC/POS command
type CommandType string

const (
	CmdText       CommandType = "text"       // Plain text to print
	CmdBold       CommandType = "bold"       // Set bold on/off
	CmdAlign      CommandType = "align"      // Set alignment
	CmdSize       CommandType = "size"       // Set character size
	CmdLineFeed   CommandType = "linefeed"   // Line feed
	CmdCut        CommandType = "cut"        // Paper cut
	CmdInitialize CommandType = "initialize" // Initialize printer
	CmdBeep       CommandType = "beep"       // Beep/buzzer
	CmdUnderline  CommandType = "underline"  // Set underline
	CmdReverse    CommandType = "reverse"    // Set reverse (white on black)
)

// Align represents text alignment
type Align int

const (
	AlignLeft   Align = 0
	AlignCenter Align = 1
	AlignRight  Align = 2
)

// Command represents a single parsed ESC/POS command
type Command struct {
	Type    CommandType `json:"type"`
	Content string      `json:"content,omitempty"` // text content
	Bold    bool        `json:"bold,omitempty"`     // for CmdBold
	Align   Align       `json:"align,omitempty"`    // for CmdAlign
	SizeX   int         `json:"size_x,omitempty"`   // horizontal multiplier (1-8)
	SizeY   int         `json:"size_y,omitempty"`   // vertical multiplier (1-8)
	Underline bool      `json:"underline,omitempty"` // for CmdUnderline
	Reverse  bool       `json:"reverse,omitempty"`   // for CmdReverse
	CutType  string     `json:"cut_type,omitempty"`  // "full" or "partial"
	BeepCount int       `json:"beep_count,omitempty"` // beep count
	BeepDuration int    `json:"beep_duration,omitempty"` // beep duration (100ms units)
}

// Receipt represents a complete parsed receipt
type Receipt struct {
	Commands []Command `json:"commands"`
	PaperWidth int     `json:"paper_width"` // 58 or 80
}
