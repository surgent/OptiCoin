var OptiCoin = {};

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