// (c) Dean McNamee <dean@gmail.com>, 2013.
//
// https://github.com/deanm/omggif
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
// IN THE SOFTWARE.
//
// omggif is a JavaScript implementation of a GIF 89a encoder and decoder,
// including animation and compression.  It does not rely on any specific
// underlying system, so should run in the browser, Node, or Plask.

export class GifReader {
    constructor(buf) {
        this.buf = buf;
        this.p = 0;

        if (
            this.buf[this.p++] !== 0x47 ||
            this.buf[this.p++] !== 0x49 ||
            this.buf[this.p++] !== 0x46 ||
            this.buf[this.p++] !== 0x38 ||
            this.buf[this.p++] !== 0x39 ||
            this.buf[this.p++] !== 0x61
        ) {
            throw new Error("Invalid GIF 89a header.");
        }

        this.width = this.buf[this.p++] | this.buf[this.p++] << 8;
        this.height = this.buf[this.p++] | this.buf[this.p++] << 8;
        this.pf0 = this.buf[this.p++];
        this.backgroundIndex = this.buf[this.p++];
        this.buf[++this.p];
        this.loopCount = null;
        this.frames = [];
        this.numGlobalColors = 1 << ((this.pf0 & 7) + 1);
        this.globalPaletteFlag = this.pf0 >> 7;
        this.globalPaletteOffset = this.globalPaletteFlag && this.p || null;
        this.globalPaletteSize = this.globalPaletteFlag && this.numGlobalColors || null;
        this.p += this.globalPaletteFlag && this.numGlobalColors * 3;

        let noEOF = true;
        let delay = 0;
        let disposal = 0;
        let transparentIndex = undefined;

        while (noEOF && this.p < this.buf.length) {
            switch (this.buf[this.p++]) {
                case 0x21:
                    switch (this.buf[this.p++]) {
                        case 0xFF:
                            if (this.isNetscapeExtension()) {
                                this.p += 14;
                                this.loopCount = this.buf[this.p++] | this.buf[this.p++] << 8;
                                this.p++;
                            }
                            else {
                                this.p += 12;
                                this.skipBlocks();
                            }
                            break;
                        case 0xF9:
                            if (this.buf[this.p++] !== 4 || this.buf[this.p + 4] !== 0) {
                                throw new Error("Invalid graphics extension block.");
                            }

                            const pf1 = this.buf[this.p++];
                            delay = this.buf[this.p++] | this.buf[this.p++] << 8;
                            transparentIndex = this.buf[this.p++];

                            if (!(pf1 & 1)) {
                                transparentIndex = undefined;
                            }

                            disposal = pf1 >> 2 & 7;
                            this.p++;
                            break;
                        case 0x01:
                        case 0xFE:
                            this.skipBlocks();
                            break;
                        default:
                            throw new Error(`Unknown graphic control label: 0x${ this.buf[this.p - 1].toString(16) }`);
                    }
                    break;
                case 0x2C:
                    const x = this.buf[this.p++] | this.buf[this.p++] << 8;
                    const y = this.buf[this.p++] | this.buf[this.p++] << 8;
                    const w = this.buf[this.p++] | this.buf[this.p++] << 8;
                    const h = this.buf[this.p++] | this.buf[this.p++] << 8;
                    const pf2 = this.buf[this.p++];
                    const localPaletteFlag = pf2 & 128;
                    const interlace = pf2 & 64;
                    const numLocalColors = 1 << ((pf2 & 7) + 1);
                    const hasLocalPalette = !!localPaletteFlag;
                    const paletteOffset = localPaletteFlag ? this.p : this.globalPaletteOffset;
                    const paletteSize = localPaletteFlag ? numLocalColors : this.globalPaletteSize;
                    this.p += localPaletteFlag && paletteSize * 3;
                    const dataOffset = this.p++;
                    this.skipBlocks();

                    this.frames.push({
                        x,
                        y,
                        w,
                        h,
                        hasLocalPalette,
                        paletteOffset,
                        paletteSize,
                        dataOffset,
                        delay,
                        disposal,
                        interlaced: !!interlace,
                        transparent: transparentIndex,
                        dataLength: this.p - dataOffset,
                    });
                    break;
                case 0x3B:
                    noEOF = false;
                    break;
                default:
                    throw new Error(`Unknown gif block: 0x${ this.buf[this.p - 1].toString(16) }`);
            }
        }
    }

    numFrames() { return this.frames.length; };
    getLoopCount() { return this.loopCount; };
    getBackgroundIndex() { return this.backgroundIndex; }
    hasGlobalPalette() { return !!this.globalPaletteFlag; }
    getGlobalPaletteSize() { return this.globalPaletteSize; }

    getGlobalPalette() {
        if (!this.globalPaletteFlag) {
            throw new Error("No global palette.");
        }

        const paletteSize = this.globalPaletteSize;
        const palette = new Array(paletteSize);
        for (let i = 0, index = this.globalPaletteOffset; i < paletteSize; ++i) {
            palette[i] = this.buf[index++] << 16 | this.buf[index++] << 8 | this.buf[index++];
        }

        return palette;
    }

    getLocalPalette(frameIndex) {
        const frame = this.frameInfo(frameIndex);

        if (!frame.hasLocalPalette) {
            throw new Error("No local palette.");
        }

        const paletteSize = frame.paletteSize;
        const palette = new Array(paletteSize);
        for (let i = 0, index = frame.paletteOffset; i < paletteSize; ++i) {
            palette[i] = this.buf[index++] << 16 | this.buf[index++] << 8 | this.buf[index++];
        }

        return palette;
    }

    frameInfo(frameIndex) {
        if (frameIndex < 0 || frameIndex >= this.frames.length) {
            throw new Error("Frame index out of range.");
        }
        return this.frames[frameIndex];
    };

    decodeAndBlitFrameRGBA(frameIndex) {
        const pixels = new Uint8Array(this.width * this.height * 4);
        const frame = this.frameInfo(frameIndex);
        const numPixels = frame.w * frame.h;
        const indexStream = this.LZWOutputIndexStream(frame.dataOffset, numPixels);
        const paletteOffset = frame.paletteOffset;
        const trans = frame.transparent ?? 256;
        const frameWidth = frame.w;
        const framestride = this.width - frameWidth;
        const opbeg = 4 * (frame.y * this.width + frame.x);
        const opend = opbeg + 4 * this.width * frame.h;
        let xleft = frameWidth;
        let op = opbeg;
        let scanstride = 4 * (framestride + (frame.interlaced && this.width * 7));
        let interlaceskip = 8;

        for (let i = 0, il = indexStream.length; i < il; ++i) {
            const index = indexStream[i];

            if (xleft === 0) {
                op += scanstride;
                xleft = frameWidth;

                if (op >= opend) {
                    scanstride = 4 * (framestride + this.width * (interlaceskip - 1));
                    op = opbeg + (frameWidth + framestride) * (interlaceskip << 1);
                    interlaceskip >>= 1;
                }
            }

            const bufIndex = paletteOffset + index * 3;
            pixels[op++] = this.buf[bufIndex];
            pixels[op++] = this.buf[bufIndex + 1];
            pixels[op++] = this.buf[bufIndex + 2];
            pixels[op++] = index === trans ? 0 : 255;

            --xleft;
        }

        return pixels;
    };

    isNetscapeExtension() {
        return (
            this.buf[this.p] !== 0x0B ||
            this.buf[this.p + 1] === 0x4E &&
            this.buf[this.p + 2] === 0x45 &&
            this.buf[this.p + 3] === 0x54 &&
            this.buf[this.p + 4] === 0x53 &&
            this.buf[this.p + 5] === 0x43 &&
            this.buf[this.p + 6] === 0x41 &&
            this.buf[this.p + 7] === 0x50 &&
            this.buf[this.p + 8] === 0x45 &&
            this.buf[this.p + 9] === 0x32 &&
            this.buf[this.p + 10] === 0x2E &&
            this.buf[this.p + 11] === 0x30 &&
            this.buf[this.p + 12] === 0x03 &&
            this.buf[this.p + 13] === 0x01 &&
            this.buf[this.p + 16] === 0
        );
    }

    skipBlocks() {
        let blockSize;

        while (blockSize !== 0) {
            blockSize = this.buf[this.p++];

            if (blockSize < 0) {
                throw Error("Invalid block size");
            }

            this.p += blockSize;
        }
    }

    LZWOutputIndexStream(p, outputLength) {
        const output = new Uint8Array(outputLength);
        const minCodeSize = this.buf[p++];
        const clearCode = 1 << minCodeSize;
        const eoiCode = clearCode + 1;
        const codeTable = new Int32Array(4096);
        let nextCode = eoiCode + 1;
        let curCodeSize = minCodeSize + 1;
        let codeMask = (1 << curCodeSize) - 1;
        let curShift = 0;
        let cur = 0;
        let op = 0;
        let subblockSize = this.buf[p++];
        let prevCode = null;

        while (true) {
            while (curShift < 16) {
                if (subblockSize === 0) {
                    break;
                }

                cur |= this.buf[p++] << curShift;
                curShift += 8;

                if (subblockSize === 1) {
                    subblockSize = this.buf[p++];
                }
                else {
                    --subblockSize;
                }
            }

            if (curShift < curCodeSize) {
                break;
            }

            const code = cur & codeMask;
            cur >>= curCodeSize;
            curShift -= curCodeSize;

            if (code === clearCode) {
                nextCode = eoiCode + 1;
                curCodeSize = minCodeSize + 1;
                codeMask = (1 << curCodeSize) - 1;
                prevCode = null;
                continue;
            }
            else if (code === eoiCode) {
                break;
            }

            const chaseCode = code < nextCode ? code : prevCode;
            let chase = chaseCode;
            let chaseLength = 0;

            while (chase > clearCode) {
                chase = codeTable[chase] >> 8;
                ++chaseLength;
            }

            const k = chase;
            const opEnd = op + chaseLength + (chaseCode !== code);

            if (opEnd > outputLength) {
                console.log("Warning, gif stream longer than expected.");
                return;
            }

            output[op++] = k;
            op += chaseLength;
            let b = op;

            if (chaseCode !== code) {
                output[op++] = k;
            }

            chase = chaseCode;

            while (chaseLength--) {
                chase = codeTable[chase];
                output[--b] = chase & 0xFF;
                chase >>= 8;
            }

            if (prevCode !== null && nextCode < 4096) {
                codeTable[nextCode++] = prevCode << 8 | k;

                if (nextCode >= codeMask + 1 && curCodeSize < 12) {
                    ++curCodeSize;
                    codeMask = codeMask << 1 | 1;
                }
            }

            prevCode = code;
        }

        if (op !== outputLength) {
            console.log("Warning, gif stream shorter than expected.");
        }

        return output;
    }
}

export class GifWriter {
    constructor(buf, w, h, { globalPalette, loop, background } = {}) {
        if (w <= 0 || h <= 0 || w > 0XFFFF || h > 0xFFFF) {
            throw new Error("Width/Height invalid.");
        }

        this.buf = buf;
        this.p = 0;
        this.globalPalette = globalPalette ?? null;
        this.ended = false;
        const loopCount = loop ?? null;
        const gpNumColors = GifWriter.checkPaletteLength(this.globalPalette).length;
        const gpNumColorsPow2 = GifWriter.calcPaletteSizePow2(gpNumColors);

        const backgroundIndex = (this.globalPalette && background) ?? null;
        if (backgroundIndex >= gpNumColors) {
            throw new Error("Background index out of range.");
        }
        if (backgroundIndex === 0) {
            throw new Error("Background index explicitly passed as 0.");
        }

        this.buf[this.p++] = 0x47;
        this.buf[this.p++] = 0x49;
        this.buf[this.p++] = 0x46;
        this.buf[this.p++] = 0x38;
        this.buf[this.p++] = 0x39;
        this.buf[this.p++] = 0x61;
        this.buf[this.p++] = w & 0xFF;
        this.buf[this.p++] = w >> 8 & 0xFF;
        this.buf[this.p++] = h & 0xFF;
        this.buf[this.p++] = h >> 8 & 0xFF;
        this.buf[this.p++] = !!this.globalPalette << 7 | (gpNumColorsPow2 - 1);
        this.buf[this.p++] = backgroundIndex;
        this.buf[this.p++] = 0;

        if (this.globalPalette) {
            for (let i = 0, il = this.globalPalette.length; i < il; ++i) {
                const rgb = this.globalPalette[i];
                this.buf[this.p++] = rgb >> 16 & 0xFF;
                this.buf[this.p++] = rgb >> 8 & 0xFF;
                this.buf[this.p++] = rgb & 0xFF;
            }
        }

        if (loopCount !== null) {
            if (loopCount < 0 || loopCount > 0xFFFF) {
                throw new Error("Loop count invalid.");
            }

            this.buf[this.p++] = 0x21;
            this.buf[this.p++] = 0xFF;
            this.buf[this.p++] = 0x0B;
            this.buf[this.p++] = 0x4E;
            this.buf[this.p++] = 0x45;
            this.buf[this.p++] = 0x54;
            this.buf[this.p++] = 0x53;
            this.buf[this.p++] = 0x43;
            this.buf[this.p++] = 0x41;
            this.buf[this.p++] = 0x50;
            this.buf[this.p++] = 0x45;
            this.buf[this.p++] = 0x32;
            this.buf[this.p++] = 0x2E;
            this.buf[this.p++] = 0x30;
            this.buf[this.p++] = 0x03;
            this.buf[this.p++] = 0x01;
            this.buf[this.p++] = loopCount & 0xFF;
            this.buf[this.p++] = loopCount >> 8 & 0xFF;
            this.buf[this.p++] = 0x00;
        }
    }

    addFrame({ x, y, w, h }, indexedPixels, opts = {}) {
        if (this.ended) {
            --this.p;
            this.ended = false;
        }

        if (x < 0 || y < 0 || x > 0xFFFF || y > 0xFFFF) {
            throw new Error("x/y invalid.");
        }
        if (w <= 0 || h <= 0 || w > 0xFFFF || h > 0xFFFF) {
            throw new Error("Width/Height invalid.");
        }
        if (indexedPixels.length < w * h) {
            throw new Error("Not enough pixels for the frame size.");
        }

        const usingLocalPalette = !!opts.palette;
        const palette = opts.palette ?? this.globalPalette;
        if (!palette) {
            throw new Error("Must supply either a local or global palette.");
        }

        const numColors = GifWriter.checkPaletteLength(palette).length;
        const numColorsPow2 = GifWriter.calcPaletteSizePow2(numColors);

        const delay = opts.delay ?? 0;
        const disposal = opts.disposal ?? 0;

        if (disposal < 0 || disposal > 3) {
            throw new Error("Disposal out of range.");
        }

        const useTrancparency = opts.transparentIndex !== undefined;
        const transparent = opts.transparentIndex ?? 0;
        if (transparent < 0 || transparent >= numColors) {
            throw new Error("Transparent color index.");
        }

        if (disposal || useTrancparency || delay) {
            this.buf[this.p++] = 0x21;
            this.buf[this.p++] = 0xF9;
            this.buf[this.p++] = 4;
            this.buf[this.p++] = disposal << 2 | useTrancparency;
            this.buf[this.p++] = delay & 0xFF;
            this.buf[this.p++] = delay >> 8 & 0xFF;
            this.buf[this.p++] = transparent;
            this.buf[this.p++] = 0;
        }

        this.buf[this.p++] = 0x2C;
        this.buf[this.p++] = x & 0xFF;
        this.buf[this.p++] = x >> 8 & 0xFF;
        this.buf[this.p++] = y & 0xFF;
        this.buf[this.p++] = y >> 8 & 0xFF;
        this.buf[this.p++] = w & 0xFF;
        this.buf[this.p++] = w >> 8 & 0xFF;
        this.buf[this.p++] = h & 0xFF;
        this.buf[this.p++] = h >> 8 & 0xFF;
        this.buf[this.p++] = usingLocalPalette && (0x80 | (numColorsPow2 - 1));

        if (usingLocalPalette) {
            for (let i = 0, il = palette.length; i < il; ++i) {
                const rgb = palette[i];
                this.buf[this.p++] = rgb >> 16 & 0xFF;
                this.buf[this.p++] = rgb >> 8 & 0xFF;
                this.buf[this.p++] = rgb & 0xFF;
            }
        }

        this.OutputLZWCodeStream(indexedPixels, numColorsPow2 < 2 ? 2 : numColorsPow2);

        return this.p;
    };

    getOutputBuffer() { return this.buf; };
    setOutputBuffer(v) { this.buf = v; };
    getOutputBufferPosition() { return this.p; };
    setOutputBufferPosition(v) { this.p = v; };

    end() {
        if (!this.ended) {
            this.buf[this.p++] = 0x3B;
            this.ended = true;
        }

        return this.p;
    };

    emitBytesToBuffer(bitBlockSize) {
        while (this.curShift >= bitBlockSize) {
            this.buf[this.p++] = this.cur & 0xFF;
            this.cur >>= 8;
            this.curShift -= 8;

            if (this.p === this.curSubblock + 256) {
                this.buf[this.curSubblock] = 255;
                this.curSubblock = this.p++;
            }
        }
    }

    emitCode(c) {
        this.cur |= c << this.curShift;
        this.curShift += this.curCodeSize;
        this.emitBytesToBuffer(8);
    }

    OutputLZWCodeStream(indexStream, minCodeSize) {
        this.buf[this.p++] = minCodeSize;
        const clearCode = 1 << minCodeSize;
        const codeMask = clearCode - 1;
        const eoiCode = clearCode + 1;
        this.curSubblock = this.p++;
        this.curCodeSize = minCodeSize + 1;
        this.curShift = 0;
        this.cur = 0;
        let nextCode = eoiCode + 1;
        let ibCode = indexStream[0] & codeMask;
        let codeTable = {};

        this.emitCode(clearCode);

        for (let i = 1, il = indexStream.length; i < il; ++i) {
            const k = indexStream[i] & codeMask;
            const curKey = ibCode << 8 | k;
            const curCode = codeTable[curKey];

            if (curCode !== undefined) {
                ibCode = curCode;
                continue;
            }

            this.emitCode(ibCode);

            if (nextCode === 4096) {
                this.emitCode(clearCode);
                nextCode = eoiCode + 1;
                this.curCodeSize = minCodeSize + 1;
                codeTable = {};
            }
            else {
                if (nextCode >= (1 << this.curCodeSize)) {
                    ++this.curCodeSize;
                }

                codeTable[curKey] = nextCode++;
            }

            ibCode = k;
        }

        this.emitCode(ibCode);
        this.emitCode(eoiCode);
        this.emitBytesToBuffer(1);

        if (this.curSubblock + 1 === this.p) {
            this.buf[this.curSubblock] = 0;
        }
        else {
            this.buf[this.curSubblock] = this.p - this.curSubblock - 1;
            this.buf[this.p++] = 0;
        }

        return this.p;
    }

    static checkPaletteLength(palette) {
        const numColors = palette.length;
        if (numColors < 2 || numColors > 256 || numColors & (numColors - 1)) {
            throw new Error("Invalid code/color length, must be power of 2 and 2 .. 256.");
        }

        return palette;
    }

    static calcPaletteSizePow2(numColors) {
        let minCodeSize = 0;
        while (numColors >>= 1) { ++minCodeSize; }

        return minCodeSize;
    }
}
