utils = {
	clamp : function(value, min, max){
		return Math.min(Math.max(value,min),max);
	},
	replaceAll : function(target, search, replacement){
		return target.replace(new RegExp(search,'g'), replacement);
	},
	hasString : function(target, search){
		return target.indexOf(search) != -1;
	}
}
