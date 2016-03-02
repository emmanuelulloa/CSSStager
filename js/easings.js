/* The equations defined here are open source under BSD License.
 * http://www.robertpenner.com/easing_terms_of_use.html (c) 2003 Robert Penner
 * Adapted to single time-based by
 * Brian Crescimanno <brian.crescimanno@gmail.com>
 * Ken Snyder <kendsnyder@gmail.com>
 */
easings = {
	_easeDict : {},
	getEase : function(e){
		if(e == undefined) return this.quadraticOut;
		if(this._easeDict[e]){
			return this._easeDict[e];
		}
		var v = e.split(" "), fn = this[v[0]] || this.quadraticOut, x;
		if(!v[1]){
			return this._easeDict[e] = fn;
		}else{
			var fn1 = v[0], fn2 = v[1], fn3 = v[2];
			if(fn1 == "mirror" || fn1 == "reverse" || fn1 == "comebackLinear" || fn1 == "comebackOut" || fn1 == "returnSmooth" || fn1 == "return"){
				if(!fn3){
					fn = this[fn2] || this.linear;	
				}else{
					fn = this.getEase(fn2 + " " + fn3) || this.linear;
				}
				return this._easeDict[e] = this.mix(this[fn1],fn);
			}else if(fn1 == "wave" || fn1 == "pulse" || fn1 == "blink" || fn1 == "stepped" || fn1 == "pow"){
				x = parseInt(v[1]) || 2;
				return this._easeDict[e] = function(t){
					return fn(t,x);
				}
			}else{
				return this._easeDict[e] = this.combine(fn1,fn2);
			}
		}
	},
	mix : function(e1,e2){
		return function (t){
			return e1(e2(t));
		}
	},
	combine : function(e1,e2){
		return function(t){
			if(t < 0.5){
				return easings[e1](t*2)/2;
			}
			return easings[e2]((t - 0.5) * 2) / 2 + 0.5;
		}
	},
	linear : function(t){
		return t;
	},
	easeOut : function(t){
		return t * t;
	},
	easeIn : function(t){
		return Math.sin(Math.PI * t/2);
	},
	easeInOut : function(t){
		return 1 - ((Math.sin(t * Math.PI + Math.PI/2)+1)/2);
	},
	strongOut : function(t){
		return (t == 1) ? 1 : 1 - Math.pow(2, -10 * t);
	},
	strongIn : function(t){
		return (t == 0) ? 0 : Math.pow(2, 10 * (t - 1));
	},
	smoothStep : function(t){
		return t * t * ( 3 - 2 * t );
	},	
	quadraticIn : function(t){
		return t * t;
	},
	quadraticOut : function(t){
		return t * ( 2 - t );
	},
	quadraticInOut : function(t){
		if ( ( t *= 2 ) < 1 ) return 0.5 * t * t;
		return - 0.5 * ( --t * ( t - 2 ) - 1 );
	},
	cubicIn : function(t){
		return t*t*t;
	},
	cubicOut : function(t){
		return --t*t*t + 1;
	},
	cubicInOut : function(t){
		if ( ( t *= 2 ) < 1 ) return 0.5 * t * t * t;
		return 0.5 * ( ( t -= 2 ) * t * t + 2 );
	},
	quarticIn : function(t){
		return t*t*t*t;
	},
	quarticOut : function(t){
		return 1-(--t*t*t*t);
	},
	quarticInOut : function(t){
		if ( ( t *= 2 ) < 1) return 0.5 * t * t * t * t;
		return - 0.5 * ( ( t -= 2 ) * t * t * t - 2 );
	},
	quinticIn : function(t){
		return t*t*t*t*t;
	},
	quinticOut : function(t){
		return --t * t * t * t * t + 1;
	},
	quinticInOut : function(t){
		if ( ( t *= 2 ) < 1 ) return 0.5 * t * t * t * t * t;
		return 0.5 * ( ( t -= 2 ) * t * t * t * t + 2 );
	},
	sinusoidalIn : function (t){
		return 1 - Math.cos( t * Math.PI / 2 );
	},
	sinusoidalOut : function(t){
		return Math.sin( t * Math.PI / 2 );
	},
	sinusoidalInOut : function(t){
		return 0.5 * ( 1 - Math.cos( Math.PI * t ) );
	},
	exponentialIn : function(t){
		return t === 0 ? 0 : Math.pow( 1024, t - 1 );
	},
	exponentialOut : function(t){
		return t === 1 ? 1 : 1 - Math.pow( 2, - 10 * t );
	},
	exponentialInOut : function(t){
		if ( t === 0 ) return 0;
		if ( t === 1 ) return 1;
		if ( ( t *= 2 ) < 1 ) return 0.5 * Math.pow( 1024, t - 1 );
		return 0.5 * ( - Math.pow( 2, - 10 * ( t - 1 ) ) + 2 );
	},
	circularIn : function(t){
		return 1 - Math.sqrt( 1 - t * t );
	},
	circularOut : function(t){
		return Math.sqrt( 1 - ( --t * t ) );
	},
	circularInOut : function(t){
		if ( ( t *= 2 ) < 1) return - 0.5 * ( Math.sqrt( 1 - t * t) - 1);
		return 0.5 * ( Math.sqrt( 1 - ( t -= 2) * t) + 1);
	},
	elasticIn : function(t){
		var s, a = 0.1, p = 0.4;
		if ( t === 0 ) return 0;
		if ( t === 1 ) return 1;
		if ( !a || a < 1 ) { a = 1; s = p / 4; }
		else s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
		return - ( a * Math.pow( 2, 10 * ( t -= 1 ) ) * Math.sin( ( t - s ) * ( 2 * Math.PI ) / p ) );
	},
	elasticOut : function(t){
		return 1 - (Math.cos(t * 4.5 * Math.PI) * Math.exp(-t * 6));
	},
	elasticInOut : function(t){
		var s, a = 0.1, p = 0.4;
		if ( t === 0 ) return 0;
		if ( t === 1 ) return 1;
		if ( !a || a < 1 ) { a = 1; s = p / 4; }
		else s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
		if ( ( t *= 2 ) < 1 ) return - 0.5 * ( a * Math.pow( 2, 10 * ( t -= 1 ) ) * Math.sin( ( t - s ) * ( 2 * Math.PI ) / p ) );
		return a * Math.pow( 2, -10 * ( t -= 1 ) ) * Math.sin( ( t - s ) * ( 2 * Math.PI ) / p ) * 0.5 + 1;
	},
	strongElasticOut : function(t){
		return -1 * Math.pow(4, -8 * t) * Math.sin((t * 6 - 1) * (2 * Math.PI) / 2) + 1;
	},
	strongElasticIn : function (t,x) {
		return Math.pow(2, 10 * --t) * Math.cos(20 * t * Math.PI * (x && x[0] || 1) / 3);
	},
	backIn : function(t){
		var s = 1.70158;
		return t * t * ( ( s + 1 ) * t - s );
	},
	backOut : function(t){
		var s = 1.70158;
		return --t * t * ( ( s + 1 ) * t + s ) + 1;
	},
	backInOut : function(t){
		var s = 1.70158 * 1.525;
		if ( ( t *= 2 ) < 1 ) return 0.5 * ( t * t * ( ( s + 1 ) * t - s ) );
		return 0.5 * ( ( t -= 2 ) * t * ( ( s + 1 ) * t + s ) + 2 );
	},
	bounceIn : function(t){
		var v;
		for (var a = 0, b = 1; 1; a += b, b /= 2){
			if (t >= (7 - 4 * a) / 11){
				v = b * b - Math.pow((11 - 6 * a - 11 * t) / 4, 2);
				break;
			}
		}
		return v;
	},
	bounceOut : function (t) {
		if (t < (1/2.75)) {
		  return (7.5625*t*t);
		} else if (t < (2/2.75)) {
		  return (7.5625*(t-=(1.5/2.75))*t + .75);
		} else if (t < (2.5/2.75)) {
		  return (7.5625*(t-=(2.25/2.75))*t + .9375);
		} else {
		  return (7.5625*(t-=(2.625/2.75))*t + .984375);
		}
	},
	bounceInOut : function(t){
		if ( t < 0.5 ) return easings.bounceIn( t * 2 ) * 0.5;
		return easings.bounceOut( t * 2 - 1 ) * 0.5 + 0.5;
	},
	bouncePast : function(t){
		if (t < (1 / 2.75)) {
		  return (7.5625 * t * t);
		} else if (t < (2 / 2.75)) {
		  return 2 - (7.5625 * (t -= (1.5 / 2.75)) * t + .75);
		} else if (t < (2.5 / 2.75)) {
		  return 2 - (7.5625 * (t -= (2.25 / 2.75)) * t + .9375);
		} else {
		  return 2 - (7.5625 * (t -= (2.625 / 2.75)) * t + .984375);
		}	
	},
	comebackLinear : function(t){
		if(t < 0.5) return 2 * t;
		else return 1 - 2 * (t - 0.5);
	},
	comebackOut : function(t){
		return -4 * t * (t-1);
	},
	comebackSmooth : function(t){
		return 0.5 - 0.5 * Math.cos(2 * Math.PI * t);
	},
	wobble : function(t){
		return (-Math.cos(t*Math.PI*(9*t))/2) + 0.5;
	},
	flicker : function(t){
		var t = t + (Math.random()-0.5)/5;
		return easings.sine(t < 0 ? 0 : t > 1 ? 1 : t);
	},
	slowMotion : function(t){
		var s = t * t, c = t*t*t;
		return 11.4475*c*s + -32.44*s*s + 36.585*c + -19.69*s + 5.0975*t;
	},
	slowMotionBack : function(t){
		var s = t * t, c = t*t*t;
		return 2.2975*c*s + -12.24*s*s + 22.785*c + -17.19*s + 5.3475*t;
	},
	hesitate : function(t){
		var s = t * t, c = t*t*t;
		return -13.245*c*s + 43.585*s*s + -47.885*c + 18.695*s + -0.15*t;
	},	
	random : function(t){
		if(t >= 1){
			return 1;
		} 
		return Math.random() * t;
	},
	mirror : function(t){
		return Math.sin( Math.PI * t );
	},
	reverse : function(t){
		return 1-t;
	},
	wave : function(t,x){
		return 0.5  * (1 - Math.cos(Math.PI * 2 * (x||2) * t ));
	},
	pulse : function(t,x){
		return (-Math.cos((t*((x||5)-.5)*2)*Math.PI)/2) + .5;
	},
	blink : function(t,x){
		return Math.round(t*(x||5)) % 2;
	},
	stepped : function(t,x){
		var x = x || 10;
		return Math.floor(t * x)/x;
	},
	pow : function(t,x){
		return Math.pow(t, (x || 2));
	}
}
//EASE SHORTCUTS
easings.elastic = easings.elasticOut;
easings.spring = easings.strongElasticOut;
easings.swing = easings.backOut;
easings.expo = easings.exponentialOut;
easings.circ = easings.circularOut;
easings.sine = easings.sinusoidalOut;
easings.bounce = easings.bounceOut;
easings.snap = easings.quinticOut;
easings.comeback = easings.comebackLinear;
easings.swingFrom = easings.backIn;
easings.swingTo = easings.backOut;
easings.swingFromTo = easings.backInOut;
