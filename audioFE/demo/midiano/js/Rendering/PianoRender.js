import { CONST } from "../data/CONST.js"
import { DomHelper } from "../ui/DomHelper.js"
import { getSetting } from "../settings/Settings.js"
import { isBlack, replaceAllString } from "../Util.js"
/**
 * Class to render the piano (and the colored keys played on the piano)
 */
export class PianoRender {
	constructor(renderDimensions) {
		this.renderDimensions = renderDimensions
		this.renderDimensions.registerResizeCallback(this.resize.bind(this))
		this.clickCallback = null
		this.blackKeyImg = new Image()
		this.blackKeyImg.src = "./blackKey.svg"
		this.blackKeyImg.onerror = () => {
			console.log("Failed to load blackKey.svg, using fallback rendering")
		}
		this.positionY = 50 //from bottom

		this.resize()
	}
	/**
	 * Resize canvases and redraw piano.
	 */
	resize() {
		this.resizeCanvases()
		this.drawPiano(this.ctxWhite, this.ctxBlack)
	}
	/**
	 * pass listeners that are called with the note number as argument when piano canvas is clicked.
	 * @param {Function} onNoteOn
	 * @param {Function} onNoteOff
	 */
	setPianoInputListeners(onNoteOn, onNoteOff) {
		this.onNoteOn = onNoteOn
		this.onNoteOff = onNoteOff
	}
	/**
	 * Register a callback to trigger when user clicks the piano Canvas. Callback is called with
	 */
	setClickCallback(callback) {
		this.clickCallback = callback
	}
	getAllCanvases() {
		return [
			this.getPianoCanvasWhite(),
			this.getPlayedKeysWhite(),
			this.getPianoCanvasBlack(),
			this.getPlayedKeysBlack()
		]
	}

	/**
	 * Resizes all piano canvases.
	 */
	resizeCanvases() {
		this.getAllCanvases().forEach(canvas => {
			DomHelper.setCanvasSize(
				canvas,
				this.renderDimensions.windowWidth,
				Math.max(
					this.renderDimensions.whiteKeyHeight,
					this.renderDimensions.blackKeyHeight
				)
			)
		})
		this.repositionCanvases()
	}

	repositionCanvases() {
		this.getAllCanvases().forEach(canvas => {
			canvas.style.top = this.renderDimensions.getAbsolutePianoPosition() + "px"
		})
	}
	/**
	 *
	 * @param {Integer} noteNumber
	 */
	drawActiveInputKey(noteNumber, color) {
		let dim = this.renderDimensions.getKeyDimensions(noteNumber)
		let isKeyBlack = isBlack(noteNumber)
		let ctx = isKeyBlack ? this.playedKeysCtxBlack : this.playedKeysCtxWhite

		if (isKeyBlack) {
			this.drawBlackKey(ctx, dim, color, true)
		} else {
			this.drawWhiteKey(ctx, dim, color, true)
		}
	}

	drawActiveKey(renderInfo, color) {
		let dim = this.renderDimensions.getKeyDimensions(renderInfo.noteNumber)
		let isKeyBlack = renderInfo.isBlack
		let ctx = isKeyBlack ? this.playedKeysCtxBlack : this.playedKeysCtxWhite

		ctx.fillStyle = color
		if (isKeyBlack) {
			this.drawBlackKey(ctx, dim, color)
		} else {
			this.drawWhiteKey(ctx, dim, color)
		}
	}

	clearPlayedKeysCanvases() {
		this.playedKeysCtxWhite.clearRect(
			0,
			0,
			this.renderDimensions.windowWidth,
			Math.max(
				this.renderDimensions.whiteKeyHeight,
				this.renderDimensions.blackKeyHeight
			)
		)
		this.playedKeysCtxBlack.clearRect(
			0,
			0,
			this.renderDimensions.windowWidth,
			Math.max(
				this.renderDimensions.whiteKeyHeight,
				this.renderDimensions.blackKeyHeight
			)
		)
	}

	drawPiano(ctxWhite, ctxBlack) {
		ctxWhite.clearRect(
			0,
			0,
			this.renderDimensions.windowWidth,
			Math.max(
				this.renderDimensions.whiteKeyHeight,
				this.renderDimensions.blackKeyHeight
			)
		)
		ctxBlack.clearRect(
			0,
			0,
			this.renderDimensions.windowWidth,
			Math.max(
				this.renderDimensions.whiteKeyHeight,
				this.renderDimensions.blackKeyHeight
			)
		)
		//Background
		ctxWhite.fillStyle = "rgba(0,0,0,1)"
		ctxWhite.fillRect(
			0,
			5,
			this.renderDimensions.windowWidth,
			this.renderDimensions.whiteKeyHeight
		)

		this.drawWhiteKeys(ctxWhite)
		if (getSetting("showKeyNamesOnPianoWhite")) {
			this.drawWhiteKeyNames(ctxWhite)
		}
		// var img = new Image()
		// img.src = "../../blackKey.svg"
		// img.onload = function () {
		this.drawBlackKeys(ctxBlack)
		if (getSetting("showKeyNamesOnPianoBlack")) {
			this.drawBlackKeyNames(ctxBlack)
		}
		// }.bind(this)

		//velvet - Commented out for modern look
		/*
		ctxWhite.strokeStyle = "rgba(155,50,50,1)"
		ctxWhite.shadowColor = "rgba(155,50,50,1)"
		ctxWhite.shadowOffsetY = 2
		ctxWhite.shadowBlur = 2
		ctxWhite.lineWidth = 4
		ctxWhite.beginPath()
		ctxWhite.moveTo(this.renderDimensions.windowWidth, 2)
		ctxWhite.lineTo(0, 2)
		ctxWhite.closePath()
		ctxWhite.stroke()
		ctxWhite.shadowColor = "rgba(0,0,0,0)"
		ctxWhite.shadowBlur = 0
		*/
	}

	drawWhiteKeys(ctxWhite) {
		for (
			let i = Math.max(0, this.renderDimensions.minNoteNumber);
			i <= this.renderDimensions.maxNoteNumber;
			i++
		) {
			let dims = this.renderDimensions.getKeyDimensions(i)
			if (!isBlack(i)) {
				this.drawWhiteKey(ctxWhite, dims, "rgba(255,255,255,1)")
			}
		}
	}

	drawBlackKeys(ctxBlack) {
		for (
			let i = Math.max(0, this.renderDimensions.minNoteNumber);
			i <= this.renderDimensions.maxNoteNumber;
			i++
		) {
			let dims = this.renderDimensions.getKeyDimensions(i)
			if (isBlack(i)) {
				this.drawBlackKey(ctxBlack, dims, "black", true)
			}
		}
	}
	drawWhiteKeyNames(ctx) {
		ctx.fillStyle = "black";
		const fontSize = this.renderDimensions.whiteKeyWidth / 2.2;
		ctx.font = `bold ${fontSize}px Arial`; // Use bold instead of black
		ctx.textAlign = "center";
		ctx.textBaseline = "bottom"; // Align text baseline to bottom
		for (
			let i = Math.max(0, this.renderDimensions.minNoteNumber);
			i <= this.renderDimensions.maxNoteNumber;
			i++
		) {
			let dims = this.renderDimensions.getKeyDimensions(i);
			if (!isBlack(i)) {
				let txt = this.getDisplayKey(CONST.MIDI_NOTE_TO_KEY[i + 21] || "");
				let txtWd = ctx.measureText(txt).width;
				ctx.fillText(
					txt,
					dims.x + dims.w / 2,
					dims.y + this.renderDimensions.whiteKeyHeight - 5 // Position slightly up from bottom
				);
			}
		}
	}
	drawBlackKeyNames(ctx) {
		const fontSize = this.renderDimensions.blackKeyWidth / 2.0; // Slightly larger perhaps
		ctx.font = `normal ${Math.ceil(fontSize)}px Arial`; // Normal weight
		ctx.textAlign = "center";
		ctx.textBaseline = "middle"; // Center vertically

		const plateFillColor = "rgba(255, 255, 255, 0.75)"; // Semi-transparent white plate
		const textColor = "#000000"; // Black text for contrast on plate
		const platePadding = fontSize * 0.2; // Padding around text
		const plateRadius = 2; // Rounded corners for the plate

		for (
			let i = Math.max(0, this.renderDimensions.minNoteNumber);
			i <= this.renderDimensions.maxNoteNumber;
			i++
		) {
			let dims = this.renderDimensions.getKeyDimensions(i);
			if (isBlack(i)) {
				let txt = this.getDisplayKey(CONST.MIDI_NOTE_TO_KEY[i + 21] || "");
				let txtMetrics = ctx.measureText(txt);
				let txtWd = txtMetrics.width;
				let txtHt = fontSize; // Approximate height

				// Plate dimensions
				let plateW = txtWd + platePadding * 2;
				let plateH = txtHt + platePadding * 2;
				let plateX = dims.x + dims.w / 2 - plateW / 2;
				let plateY = dims.y + this.renderDimensions.blackKeyHeight * 0.8 - plateH / 2; // Position lower middle

				// Draw background plate
				ctx.fillStyle = plateFillColor;
				ctx.beginPath();
				ctx.moveTo(plateX + plateRadius, plateY);
				ctx.lineTo(plateX + plateW - plateRadius, plateY);
				ctx.arcTo(plateX + plateW, plateY, plateX + plateW, plateY + plateRadius, plateRadius);
				ctx.lineTo(plateX + plateW, plateY + plateH - plateRadius);
				ctx.arcTo(plateX + plateW, plateY + plateH, plateX + plateW - plateRadius, plateY + plateH, plateRadius);
				ctx.lineTo(plateX + plateRadius, plateY + plateH);
				ctx.arcTo(plateX, plateY + plateH, plateX, plateY + plateH - plateRadius, plateRadius);
				ctx.lineTo(plateX, plateY + plateRadius);
				ctx.arcTo(plateX, plateY, plateX + plateRadius, plateY, plateRadius);
				ctx.closePath();
				ctx.fill();

				// Draw text on top of plate
				ctx.fillStyle = textColor;
				ctx.fillText(txt, dims.x + dims.w / 2, plateY + plateH / 2);
			}
		}
	}
	getDisplayKey(key) {
		let blackToHash = replaceAllString(key, "b", "#")
		return blackToHash.replace(/[0-9]/g, "")
	}
	/**
	 *
	 * @param {CanvasRenderingContext2D} ctx
	 * @param {Dimensions} dims
	 */
	drawWhiteKey(ctx, dims, color) {
		const { x, y, w, h } = dims
		const borderRadius = Math.min(w * 0.05, 5); // Small radius

		// Simplified Drawing
		ctx.fillStyle = color || "#FFFFFF"; // Solid white or provided color
		ctx.strokeStyle = "#CCCCCC"; // Light grey border
		ctx.lineWidth = 1;

		// Draw rounded rectangle path
		ctx.beginPath();
		ctx.moveTo(x + borderRadius, y);
		ctx.lineTo(x + w - borderRadius, y);
		ctx.arcTo(x + w, y, x + w, y + borderRadius, borderRadius);
		ctx.lineTo(x + w, y + h - borderRadius);
		ctx.arcTo(x + w, y + h, x + w - borderRadius, y + h, borderRadius);
		ctx.lineTo(x + borderRadius, y + h);
		ctx.arcTo(x, y + h, x, y + h - borderRadius, borderRadius);
		ctx.lineTo(x, y + borderRadius);
		ctx.arcTo(x, y, x + borderRadius, y, borderRadius);
		ctx.closePath();
		
		ctx.fill();
		ctx.stroke();

		// Comment out old gradient/stroke logic
		/*
		//shadow
		// ctx.shadowColor = "rgba(0,0,0,0.3)"
		// ctx.shadowOffsetY = 1
		// ctx.shadowBlur = 2
		ctx.fillStyle = this.getKeyGradient(ctx, dims)
		ctx.strokeStyle = "black"
		ctx.lineWidth = 1
		this.getWhiteKeyPath(ctx, dims.x, dims.y, dims.w, dims.h, 2)
		ctx.stroke()
		ctx.fill()
		*/
	}
	getKeyGradient(ctx) {
		if (this.keyGradient == null) {
			this.keyGradient = ctx.createLinearGradient(
				this.renderDimensions.windowWidth / 2,
				0,
				this.renderDimensions.windowWidth / 2,
				this.renderDimensions.whiteKeyHeight
			)
			this.keyGradient.addColorStop(0, "rgba(0,0,0,1)")
			this.keyGradient.addColorStop(1, "rgba(255,255,255,0.5)")
		}
		return this.keyGradient
	}
	getWhiteKeyPath(ctx, x, y, width, height, radius) {
		ctx.beginPath()
		ctx.moveTo(x + 1, y)
		ctx.lineTo(x - 1 + width, y)
		ctx.lineTo(x - 1 + width, y + height - radius)
		ctx.lineTo(x - 1 + width - radius, y + height)
		ctx.lineTo(x + 1 + radius, y + height)
		ctx.lineTo(x + 1, y + height - radius)
		ctx.lineTo(x + 1, y)
	}

	strokeWhiteKey(dims, color) {
		let radius = Math.ceil(this.renderDimensions.whiteKeyWidth / 20)
		let x = dims.x
		let y = Math.floor(dims.y) + 6
		let height = Math.floor(dims.h) - 8
		let width = dims.w
		let ctx = this.playedKeysCtxWhite

		this.getWhiteKeyPath(ctx, x, y, width, height, radius)
		ctx.strokeStyle = "black"
		ctx.lineWidth = 50
		ctx.fill()
		ctx.closePath()
	}
	drawBlackKeySvg(ctx, dims, color) {
		let radiusTop = this.renderDimensions.blackKeyWidth / 15
		let radiusBottom = this.renderDimensions.blackKeyWidth / 8
		let x = dims.x
		let y = dims.y + 5
		let height = dims.h
		let width = dims.w

		ctx.drawImage(this.blackKeyImg, x, y, width, height)
	}
	/**
	 *
	 * @param {CanvasRenderingContext2D} ctx
	 * @param {Dimensions} dims
	 */
	drawBlackKey(ctx, dims, color, noShadow) {
		const { x, y, w, h } = dims;
		const borderRadius = Math.min(w * 0.1, 4); // Small radius

		// Simplified Drawing
		ctx.fillStyle = color || "#444444"; // Solid dark grey or provided color
		ctx.strokeStyle = "#666666"; // Slightly lighter border
		ctx.lineWidth = 1;

		// Draw rounded rectangle path
		ctx.beginPath();
		ctx.moveTo(x + borderRadius, y);
		ctx.lineTo(x + w - borderRadius, y);
		ctx.arcTo(x + w, y, x + w, y + borderRadius, borderRadius);
		ctx.lineTo(x + w, y + h - borderRadius);
		ctx.arcTo(x + w, y + h, x + w - borderRadius, y + h, borderRadius);
		ctx.lineTo(x + borderRadius, y + h);
		ctx.arcTo(x, y + h, x, y + h - borderRadius, borderRadius);
		ctx.lineTo(x, y + borderRadius);
		ctx.arcTo(x, y, x + borderRadius, y, borderRadius);
		ctx.closePath();

		ctx.fill();
		ctx.stroke();

		// Comment out old shadow/SVG logic
		/*
		let radiusTop = this.renderDimensions.blackKeyWidth / 10
		let radiusBottom = radiusTop

		if (!noShadow) {
			ctx.shadowColor = "rgba(0,0,0,0.5)"
			ctx.shadowOffsetY = 2
			ctx.shadowBlur = 3
		}
		this.getBlackKeyPath(
			ctx,
			dims.x,
			dims.y,
			radiusTop,
			dims.w,
			dims.h,
			radiusBottom
		)
		ctx.fillStyle = color
		ctx.fill()

		ctx.shadowOffsetY = 0
		ctx.shadowBlur = 0
		*/
	}
	strokeBlackKey(dims, color) {
		let radiusTop = 0 //this.renderDimensions.blackKeyWidth / 15
		let radiusBottom = this.renderDimensions.blackKeyWidth / 8
		let x = dims.x
		let y = dims.y + 6
		let height = dims.h
		let width = dims.w
		let ctx = this.playedKeysCtxBlack
		color = color || "white"

		this.getBlackKeyPath(ctx, x, y, radiusTop, width, height, radiusBottom)

		ctx.strokeStyle = color
		ctx.stroke()
		ctx.closePath()
	}

	getBlackKeyPath(ctx, x, y, radiusTop, width, height, radiusBottom) {
		ctx.beginPath()
		ctx.moveTo(x + 1, y + radiusTop)
		ctx.lineTo(x + 1 + radiusTop, y)
		ctx.lineTo(x - 1 - radiusTop + width, y)
		ctx.lineTo(x - 1 + width, y + radiusTop)
		ctx.lineTo(x - 1 + width, y + height - radiusBottom)
		ctx.lineTo(x - 1 + width - radiusBottom, y + height)
		ctx.lineTo(x + 1 + radiusBottom, y + height)
		ctx.lineTo(x + 1, y + height - radiusBottom)
		ctx.lineTo(x + 1, y)
	}

	getPianoCanvasWhite() {
		if (!this.pianoCanvasWhite) {
			this.pianoCanvasWhite = DomHelper.createCanvas(
				this.renderDimensions.windowWidth,
				Math.max(
					this.renderDimensions.whiteKeyHeight,
					this.renderDimensions.blackKeyHeight
				),
				{
					position: "absolute",
					left: "0px",
					zIndex: 99
				}
			)
			this.pianoCanvasWhite.className = "pianoCanvas"
			document.body.appendChild(this.pianoCanvasWhite)
			this.ctxWhite = this.pianoCanvasWhite.getContext("2d")
		}
		return this.pianoCanvasWhite
	}
	getPlayedKeysWhite() {
		if (!this.playedKeysCanvasWhite) {
			this.playedKeysCanvasWhite = DomHelper.createCanvas(
				this.renderDimensions.windowWidth,
				Math.max(
					this.renderDimensions.whiteKeyHeight,
					this.renderDimensions.blackKeyHeight
				),
				{
					position: "absolute",
					left: "0px",
					zIndex: 99
				}
			)
			this.playedKeysCanvasWhite.className = "pianoCanvas"
			document.body.appendChild(this.playedKeysCanvasWhite)
			this.playedKeysCtxWhite = this.playedKeysCanvasWhite.getContext("2d")
		}
		return this.playedKeysCanvasWhite
	}
	getPianoCanvasBlack() {
		if (!this.pianoCanvasBlack) {
			this.pianoCanvasBlack = DomHelper.createCanvas(
				this.renderDimensions.windowWidth,
				Math.max(
					this.renderDimensions.whiteKeyHeight,
					this.renderDimensions.blackKeyHeight
				),
				{
					position: "absolute",
					left: "0px",
					zIndex: 99,
					boxShadow: "0px 0px 15px 15px rgba(0,0,0,0.4)"
				}
			)
			this.pianoCanvasBlack.className = "pianoCanvas"
			document.body.appendChild(this.pianoCanvasBlack)
			this.ctxBlack = this.pianoCanvasBlack.getContext("2d")
		}
		return this.pianoCanvasBlack
	}
	getPlayedKeysBlack() {
		if (!this.playedKeysCanvasBlack) {
			this.playedKeysCanvasBlack = DomHelper.createCanvas(
				this.renderDimensions.windowWidth,
				Math.max(
					this.renderDimensions.whiteKeyHeight,
					this.renderDimensions.blackKeyHeight
				),
				{
					position: "absolute",
					left: "0px",
					zIndex: 99
				}
			)
			this.playedKeysCanvasBlack.className = "pianoCanvas"
			document.body.appendChild(this.playedKeysCanvasBlack)
			this.playedKeysCtxBlack = this.playedKeysCanvasBlack.getContext("2d")

			this.playedKeysCanvasBlack.addEventListener(
				"mousedown",
				this.onPianoMousedown.bind(this)
			)
			this.playedKeysCanvasBlack.addEventListener(
				"mouseup",
				this.onPianoMouseup.bind(this)
			)
			this.playedKeysCanvasBlack.addEventListener(
				"mousemove",
				this.onPianoMousemove.bind(this)
			)
			this.playedKeysCanvasBlack.addEventListener(
				"mouseleave",
				this.onPianoMouseleave.bind(this)
			)
		}
		return this.playedKeysCanvasBlack
	}
	onPianoMousedown(ev) {
		if (getSetting("clickablePiano")) {
			let { x, y } = this.getCanvasPosFromMouseEvent(ev)
			let keyUnderMouse = this.getKeyAtPos(x, y)
			if (keyUnderMouse >= 0) {
				this.currentKeyUnderMouse = keyUnderMouse
				this.isMouseDown = true
				this.onNoteOn(keyUnderMouse)
			} else {
				this.clearCurrentKeyUnderMouse()
			}
		}
	}

	onPianoMouseup(ev) {
		this.isMouseDown = false
		this.clearCurrentKeyUnderMouse()
	}
	onPianoMouseleave(ev) {
		this.isMouseDown = false
		this.clearCurrentKeyUnderMouse()
	}

	onPianoMousemove(ev) {
		if (getSetting("clickablePiano")) {
			let { x, y } = this.getCanvasPosFromMouseEvent(ev)
			let keyUnderMouse = this.getKeyAtPos(x, y)
			if (this.isMouseDown && keyUnderMouse >= 0) {
				if (this.currentKeyUnderMouse != keyUnderMouse) {
					this.onNoteOff(this.currentKeyUnderMouse)
					this.onNoteOn(keyUnderMouse)
					this.currentKeyUnderMouse = keyUnderMouse
				}
			} else {
				this.clearCurrentKeyUnderMouse()
			}
		}
	}
	clearCurrentKeyUnderMouse() {
		if (this.currentKeyUnderMouse >= 0) {
			this.onNoteOff(this.currentKeyUnderMouse)
		}
		this.currentKeyUnderMouse = -1
	}
	getKeyAtPos(x, y) {
		let clickedKey = -1
		for (let i = 0; i <= 87; i++) {
			let dims = this.renderDimensions.getKeyDimensions(i)
			if (x > dims.x && x < dims.x + dims.w) {
				if (y > dims.y && y < dims.y + dims.h) {
					if (clickedKey == -1) {
						clickedKey = i
					} else if (isBlack(i) && !isBlack(clickedKey)) {
						clickedKey = i
						break
					}
				}
			}
		}
		return clickedKey
	}
	getCanvasPosFromMouseEvent(ev) {
		let canvHt = Math.max(
			this.renderDimensions.whiteKeyHeight,
			this.renderDimensions.blackKeyHeight
		)
		let x = ev.clientX
		let y =
			ev.clientY -
			(this.renderDimensions.windowHeight -
				canvHt -
				(this.renderDimensions.windowHeight -
					canvHt -
					this.renderDimensions.getAbsolutePianoPosition()))
		return { x, y }
	}
}
