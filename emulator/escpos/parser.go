package escpos

import "strings"

// Parser holds state for parsing ESC/POS byte sequences
type Parser struct {
	bold      bool
	underline bool
	reverse   bool
	align     Align
	sizeX     int
	sizeY     int
	textBuf   strings.Builder
}

// NewParser creates a new ESC/POS parser
func NewParser() *Parser {
	return &Parser{align: AlignLeft, sizeX: 1, sizeY: 1}
}

// Reset resets the parser state
func (p *Parser) Reset() {
	p.bold = false
	p.underline = false
	p.reverse = false
	p.align = AlignLeft
	p.sizeX = 1
	p.sizeY = 1
	p.textBuf.Reset()
}

func (p *Parser) flush() []Command {
	var cmds []Command
	if p.textBuf.Len() > 0 {
		cmds = append(cmds, Command{Type: CmdText, Content: p.textBuf.String()})
		p.textBuf.Reset()
	}
	return cmds
}

// Parse parses a byte slice into a Receipt
func (p *Parser) Parse(data []byte) Receipt {
	p.Reset()
	var commands []Command
	i := 0
	n := len(data)

	for i < n {
		b := data[i]

		// ESC sequences (0x1B)
		if b == 0x1B && i+1 < n {
			next := data[i+1]
			switch next {
			case 0x40: // ESC @ - Initialize
				commands = append(commands, p.flush()...)
				commands = append(commands, Command{Type: CmdInitialize})
				p.Reset()
				i += 2
				continue
			case 0x45, 0x65: // ESC E n - Bold
				if i+2 < n {
					commands = append(commands, p.flush()...)
					p.bold = data[i+2] != 0
					commands = append(commands, Command{Type: CmdBold, Bold: p.bold})
					i += 3
					continue
				}
			case 0x61: // ESC a n - Alignment
				if i+2 < n {
					commands = append(commands, p.flush()...)
					p.align = Align(data[i+2])
					commands = append(commands, Command{Type: CmdAlign, Align: p.align})
					i += 3
					continue
				}
			case 0x2D: // ESC - n - Underline
				if i+2 < n {
					commands = append(commands, p.flush()...)
					p.underline = data[i+2] != 0
					commands = append(commands, Command{Type: CmdUnderline, Underline: p.underline})
					i += 3
					continue
				}
			case 0x7B: // ESC { n - Reverse
				if i+2 < n {
					commands = append(commands, p.flush()...)
					p.reverse = data[i+2] != 0
					commands = append(commands, Command{Type: CmdReverse, Reverse: p.reverse})
					i += 3
					continue
				}
			}
			i += 2
			continue
		}

		// GS sequences (0x1D)
		if b == 0x1D && i+1 < n {
			next := data[i+1]
			switch next {
			case 0x21: // GS ! n - Character size
				if i+2 < n {
					commands = append(commands, p.flush()...)
					val := data[i+2]
					p.sizeX = int(val&0x0F) + 1
					p.sizeY = int((val>>4)&0x0F) + 1
					if p.sizeX > 8 {
						p.sizeX = 8
					}
					if p.sizeY > 8 {
						p.sizeY = 8
					}
					commands = append(commands, Command{Type: CmdSize, SizeX: p.sizeX, SizeY: p.sizeY})
					i += 3
					continue
				}
			case 0x56: // GS V m - Cut
				if i+2 < n {
					commands = append(commands, p.flush()...)
					cutType := "full"
					if data[i+2] == 1 {
						cutType = "partial"
					}
					commands = append(commands, Command{Type: CmdCut, CutType: cutType})
					i += 3
					continue
				}
			case 0x42: // GS B n - Beep
				if i+3 < n {
					commands = append(commands, p.flush()...)
					commands = append(commands, Command{
						Type:         CmdBeep,
						BeepCount:    int(data[i+2]),
						BeepDuration: int(data[i+3]),
					})
					i += 4
					continue
				}
			}
			i += 2
			continue
		}

		// Line feed
		if b == 0x0A {
			commands = append(commands, p.flush()...)
			commands = append(commands, Command{Type: CmdLineFeed})
			i++
			continue
		}

		// Carriage return - skip
		if b == 0x0D {
			i++
			continue
		}

		// Regular text byte
		p.textBuf.WriteByte(b)
		i++
	}

	commands = append(commands, p.flush()...)
	return Receipt{Commands: commands}
}
