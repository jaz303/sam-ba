TOOLCHAIN=arm-none-eabi-
AS=$(TOOLCHAIN)as
OBJCOPY=$(TOOLCHAIN)objcopy

SRCDIR := src
OUTDIR := build

ASM 	:= $(shell find src -name '*.asm')
OBJ 	:= $(subst src/, build/, $(ASM:.asm=.obj))
BIN 	:= $(OBJ:.obj=.bin)
JS 		:= $(subst build/, src/, $(BIN:.bin=.js))

$(OUTDIR)/%.obj: $(SRCDIR)/%.asm
	mkdir -p $(dir $@)
	$(AS) -o $@ $<

$(OUTDIR)/%.bin: $(OUTDIR)/%.obj
	mkdir -p $(dir $@)
	$(OBJCOPY) -O binary $< $@

$(SRCDIR)/%.js: $(OUTDIR)/%.bin
	./scripts/appletgen $(<:.bin=.obj) $< > $@

all: $(JS)

all_obj: $(OBJ)

all_bin: $(BIN)

clean:
	rm -rf build
	rm -f $(JS)

.PHONY: all clean
