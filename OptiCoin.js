var OptiCoin = {};

OptiCoin.contrast = function(data, amount) {
	var d = data.data;
	var l = d.length;
	for(var i = 0; i < l; ++i) {
		if((i & 3) == 3) continue;
		
		var v = (d[i] - 128) * amount + 128;
		v = ~~v;
		if(v < 0) v = 0;
		if(v > 255) v = 255;
		d[i] = v;
	}
}

OptiCoin.threshold = function(data, lum) {
	var d = data.data;
	var l = d.length;
	for(var i = 0; i < l; i += 4) {
		if(d[i] * d[i] + d[i + 1] * d[i + 1] + d[i + 2] * d[i + 2] > lum * lum) {
			d[i] = 255;
			d[i + 1] = 255;
			d[i + 2] = 255;
		}
		else {
			d[i] = 0;
			d[i + 1] = 0;
			d[i + 2] = 0;
		}
	}
}

OptiCoin.vectorThreshold = function(data, r, g, b, dotTol, magTol) {
	var dat = data.data;
	var len = dat.length;

	var mag = Math.sqrt(r*r + g*g + b*b);
	r /= mag;
	g /= mag;
	b /= mag;

	for(var i = 0; i < len; i += 4) {
		var sr = dat[i];
		var sg = dat[i + 1];
		var sb = dat[i + 2];
		var sMag = Math.sqrt(sr*sr + sg*sg + sb*sb);
		sr /= sMag;
		sg /= sMag;
		sb /= sMag;
		var dot = r*sr + g*sg + b*sb;

		if((1 - dot) < dotTol && (Math.abs(sMag - mag) / 255) < magTol) {
			dat[i] = 0;
			dat[i + 1] = 0;
			dat[i + 2] = 0;
		}
		else {
			dat[i] = 255;
			dat[i + 1] = 255;
			dat[i + 2] = 255;
		}
	}
}

OptiCoin.Kernel = {};
OptiCoin.Kernel.BOX_BLUR = [1/9, 1/9, 1/9, 1/9, 1/9, 1/9, 1/9, 1/9, 1/9];
OptiCoin.Kernel.GAUSSIAN_BLUR = [1/16, 1/8, 1/16, 1/8, 1/4, 1/8, 1/16, 1/8, 1/16];
OptiCoin.Kernel.SHARP = [0, -1, 0, -1, 5, -1, 0, -1, 0];
OptiCoin.Kernel.EDGE = [-1, -1, -1, -1, 8, -1, -1, -1, -1];

OptiCoin.convolve = function(data, kernel) {
	var w = data.width;
	var h = data.height;
	var dat = data.data;
	var k = kernel;
	var prevRow = null;
	var prevPix = null;

	for(var y = 0; y < h; ++y) {
		prevPix = null;
		var prevRowTemp = Array.prototype.slice.call(dat, y * w * 4, (y + 1) * w * 4);

		for(var x = 0; x < w; ++x) {
			var prevPixTemp = Array.prototype.slice.call(dat, y * w * 4 + x * 4, y * w * 4 + (x + 1) * 4);
			var m11, m12, m13, m21, m22, m23, m31, m32, m33;

			for(var i = 0; i < 3; ++i) {
				m11 = x == 0 ? (y == 0 ? dat[i] : prevRow[i]) : (y == 0 ? prevPix[i] : prevRow[(x - 1) * 4 + i]);
				m12 = y == 0 ? dat[x * 4 + i] : prevRow[x * 4 + i];
				m13 = x == w - 1 ? (y == 0 ? dat[x * 4 + i] : prevRow[x * 4 + i]) : (y == 0 ? dat[(x + 1) * 4 + i] : prevRow[(x + 1) * 4 + i]);
				m21 = x == 0 ? dat[y * w * 4 + x * 4 + i] : prevPix[i];
				m22 = dat[y * w * 4 + x * 4 + i];
				m23 = x == w - 1 ? dat[y * w * 4 + x * 4 + i] : dat[y * w * 4 + (x + 1) * 4 + i];
				m31 = x == 0 ? (y == h - 1 ? dat[y * w * 4 + x * 4 + i] : dat[(y + 1) * w * 4 + x * 4 + i]) : (y == h - 1 ? dat[y * w * 4 + x * 4 + i] : dat[(y + 1) * w * 4 + (x - 1) * 4 + i]);
				m32 = y == h - 1 ? dat[y * w * 4 + i] : dat[(y + 1) * w * 4 + x * 4 + i];
				m33 = x == w - 1 ? (y == h - 1 ? dat[y * w * 4 + x * 4 + i] : dat[(y + 1) * w * 4 + x * 4 + i]) : (y == h - 1 ? dat[y * w * 4 + (x + 1) * 4 + i] : dat[(y + 1) * w * 4 + (x + 1) * 4 + i]);
			
				var val = k[0] * m11 + k[1] * m12 + k[2] * m13 +
				          k[3] * m21 + k[4] * m22 + k[5] * m23 +
				          k[6] * m31 + k[7] * m32 + k[8] * m33;

				val = ~~val;
				if(val < 0) val = 0;
				if(val > 255) val = 255;

				dat[y * w * 4 + x * 4 + i] = val;
			}

			prevPix = prevPixTemp;
		}

		prevRow = prevRowTemp;
	}
}

OptiCoin.extractSegments = function(data, columns, rows) {
	var visited = [];
	var segments = [];
	for(var i = 0; i < data.height; ++i) {
		visited.push([]);
		for(var j = 0; j < data.width; ++j)
			visited[i].push(false);
	}

	for(var i = 0; i < rows; ++i) {
		for(var j = 0; j < columns; ++j) {
			var x = ~~(data.width * (j / (columns + 1)));
			var y = ~~(data.height * (i / (rows + 1)));

			var segment = {mass: 0, centerX: 0, centerY: 0, minX: 9999, minY: 9999, maxX: 0, maxY: 0};
			var queue = [{x: x, y: y}];
			var points = [];
			while(queue.length > 0) {
				var pos = queue.pop();
				x = pos.x;
				y = pos.y;
				if(x < 0 || y < 0 || x >= data.width || y >= data.height || visited[y][x]) continue;
				visited[y][x] = true;
				if(data.data[y * data.width * 4 + x * 4] < 128) continue;

				segment.mass++;
				if(segment.minX > x) segment.minX = x;
				if(segment.minY > y) segment.minY = y;
				if(segment.maxX < x) segment.maxX = x;
				if(segment.maxY < x) segment.maxY = y;
				points.push({x: x, y: y});

				if(x - 1 >= 0)
					queue.push({x: x - 1, y: y});
				if(y - 1 >= 0)
					queue.push({x: x, y: y - 1});
				if(x + 1 < data.width)
					queue.push({x: x + 1, y: y});
				if(y + 1 < data.height)
					queue.push({x: x, y: y + 1});
			}

			if(segment.mass > 0) {
				for(var k = 0; k < points.length; ++k) {
					segment.centerX += points[k].x / segment.mass;
					segment.centerY += points[k].y / segment.mass;
				}
				segments.push(segment);
			}
		}
	}

	return segments;
}

OptiCoin.judge = function(src, mask) {
	if(src.width != mask.width || src.height != mask.height)
		throw 'OptiCoin.Judge: `src.width` and `src.height` must match `mask.width` and `mask.height`';

	var sd = src.data;
	var md = mask.data;
	var len = sd.length;

	var max = 0;
	var score = 0;
	for(var i = 0; i < l; i += 4) {
		max += md[i] / 255;
		score += (sd[i] * md[i]) / (255 * 255);
	}

	return score / max;
}

OptiCoin.ScoreKeeper = function(width, height, maskImages, maskLabels) {
	//Public:
		this.bestMatch = function(ctx, x, y) {
			var winner = {score: 0, label: null};
			for(var i = 0; i < masks.length; ++i) {
				var sd = ctx.getImageData(x, y, width, height);
				var score = OptiCoin.judge(sd, masks[i].data);
				if(score >= winner.score) {
					winner.score = score;
					winner.label = masks[i].label;
				}
			}
			return winner;
		}

	//Private:
		var masks = [];
		var cnvs = document.createElement('canvas');
		var ctx = cnvs.getContext('2d');

		//Init
		if(maskFilePaths.length != maskIds.length)
			throw 'OptiCoin.ScoreKeeper: maskImages.length must equal maskLabels.length';

		cnvs.width = width;
		cnvs.height = height;

		for(var i = 0; i < maskImages.length; ++i) {
			ctx.clearRect(0, 0, width, height);
			ctx.drawImage(maskImages[i], 0, 0);
			masks[i] = {
				data: ctx.getImageData(0, 0, width, height),
				label: maskLabels[i]
			};
		}
}