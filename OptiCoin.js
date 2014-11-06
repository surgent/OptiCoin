var OptiCoin = {};

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