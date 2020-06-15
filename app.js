
function throwError(message) {
	alert(message);
	throw new Error(message);
};

var srv = new (OOP.create({
	initialize: function () {
		this.repo = {};
	},
	get: function (srvName) {
		if (this.repo[srvName] == null) throwError('Serviço "' + srvName + '" não existe.');
		return this.repo[srvName];
	},
	add: function (srvName, service) {
		if (this.repo[srvName] != null) throwError('Serviço já existe.');
		this.put(srvName, service);
	},
	put: function (srvName, service) {
		this.repo[srvName] = service;
	}
}))();

(function () {

	var fps = 30;
	var updateTime = 30;
	var colorPrimary = '#3F51B5';
	var colorSecundary = '';
	var colorAcent = 'white';

	var CtxUtils = new (OOP.create({
		resetShadown: function(ctx){
			ctx.shadowColor = 'white';
			ctx.shadowBlur = 0;
			ctx.shadowOffsetX = 0;
			ctx.shadowOffsetY = 0;
		}
	}));

	var QuestionBuilder = OOP.create({
		initialize: function (oper,tab) {
			if ('+-/x'.indexOf(oper) == -1) throwError('Operação não permitida (operações + - * /).');
			if (tab < 1 || tab > 9) throwError('Tabuada não permitida (tabuadas 2,3,4,5,6,7,8,9).'); 
			this.oper = oper;
			this.tab = tab;
			this.questions = [];
			for (var j = 2; j <= 9; j++) {
				var c = null;
				if (oper == '+' || oper == '-') c = tab+j;
				if (oper == '/' || oper == 'x') c = tab*j;
				this.questions.push(tab);
				this.questions.push(j);
				this.questions.push(c);			
			}
		},
		get: function (i) {
			return this.questions[i];
		},
		getOper: function(){
			return this.oper;
		},
		getTab: function(){
			return this.tab;
		},
		length: function () {
			return this.questions.length;
		}
	});
	
	var MouseUtils = OOP.create({
		entre: function (x,y,w,h,mx,my) {
			return mx > x
				&& mx < x+w
				&& my > y
				&& my < y+h;
		}
	});
	srv.add("mouseUtils", new MouseUtils());

	var EventDispatcher = OOP.create({
		initialize: function(){
			this.events = [];
			this.handlers = 0;
			this.executing = false;
			this.removeList = [];
			this.addList = [];
		},
		addEventListener: function(eventName,callback){
			if (eventName == null) throwError('eventName é obrigatório!.');
			if (callback == null) throwError('callback é obrigatório!.');
			var event = {
				eventName: eventName,
				callback: callback,
				handler: ++this.handlers
			};
			if (this.executing) this.addList.push(event);
			else this.events.unshift(event);
			return this.handlers;
		},
		removeEventListener: function (handler) {
			if (handler == null) throwError('handler é obrigatório!.');
			this.events.for(function(e,i){
				if (e.handler == handler) {
					if (this.executing) this.removeList.push(e);
					else this.events.splice(i,1);
					return true;
				}
			},this);
		},
		dispatchEvent: function (eventName,arg) {
			if (eventName == null) throwError('eventName é obrigatório!.');
			var event = null;
			for (var i = this.events.length-1; i >= 0; i--) {
				event = this.events[i];
				if (event.eventName == eventName) {
					var executing = this.executing;
					if (!executing) this.executing = true; 
					
					event.callback(arg);

					if (this.removeList.length > 0) {
						for (var j = 0; j < this.removeList.length; j++) {
							var k = this.events.indexOf(this.removeList[j]);
							if (k > -1 && k < i) i--;
							if (k > -1) this.events.splice(k,1);
						}
						this.removeList = [];
					}

					if (this.addList.length > 0) {
						for (var j = 0; j < this.addList.length; j++) {
							this.events.unshift(this.addList[j]);
							i++;
						}
						this.addList = [];
					}
					
					if (!executing) this.executing = false;
				}
			}
		}
	});

	var AnimatorNumber = OOP.create(EventDispatcher,{
		initialize: function (obj,prop){
			this.$super.initialize();
			this.obj = obj;
			this.prop = prop;
			this.reset();
		},
		reset: function (){
			this.add = 0;
			this.alt = 0;
			this.vel = updateTime/30;
			this.aceler = updateTime/60;
			this.animando = false;
		},
		sum: function (add) {
			this.add += add.abs();
			this.alt += add;
		},
		update: function () {
			if (this.add > 0) {
				if (!this.animando) {
					this.animando = true;
					this.dispatchEvent('beforeAnimation');
				}
				if (this.vel > this.add) {
					this.obj[this.prop] += this.alt;
					this.alt -= this.alt;
					this.add -= this.add;
				} else {
					this.obj[this.prop] += this.alt < 0 ? -this.vel : this.vel;
					this.alt -= this.alt < 0 ? -this.vel : this.vel;
					this.add -= this.vel;
				}
				this.vel += (this.aceler+1)*2-1;
				if (this.add <= 0) {
					this.reset();
					this.dispatchEvent('afterAnimation');
				}
			}
		},
		stop: function(){
			this.reset();
			this.dispatchEvent('afterAnimation');
		}
	});

	var Block = OOP.create(EventDispatcher,{
		initialize: function (con) {
			this.$super.initialize();
			this.con = con;
			this.visivel = true;
			this.selected = false;
			this.animations = 0;
			this.animators = [];
			this.animX = new AnimatorNumber(this,'x');
			this.animX.addEventListener('beforeAnimation',this.beforeAnimation);
			this.animX.addEventListener('afterAnimation',this.afterAnimation);
			this.animators.push(this.animX);
			this.animY = new AnimatorNumber(this,'y');
			this.animY.addEventListener('beforeAnimation',this.beforeAnimation);
			this.animY.addEventListener('afterAnimation',this.afterAnimation);
			this.animators.push(this.animY);
			this.errando = 0;
			this.borderSize = 4;
			this.borderColor = 'white';
		},
		isAnimando: function (){
			return this.animations.round(0) != 0;
		},
		beforeAnimation: function (){
			if (this.animations.round(0) == 0) {
				this.animations = this.animations.round(0);
				this.dispatchEvent('beforeAnimation');
			}
			this.animations++;
		},
		afterAnimation: function (){
			this.animations--;
			if (this.animations.round(0) == 0) {
				this.animations = this.animations.round(0);
				this.dispatchEvent('afterAnimation');
			}
		},
		setX: function (x) {
			this.x = x;
		},
		getX: function () {
			return this.x;
		},
		setY: function (y) {
			this.y = y;
		},
		getY: function () {
			return this.y;
		},
		setW: function (w) {
			this.w = w;
		},
		getW: function () {
			return this.w;
		},
		setH: function (h) {
			this.h = h;
		},
		getH: function () {
			return this.h;
		},
		setM: function(m) {
			this.m = m;
		},
		isVisivel: function () {
			return this.visivel;
		},
		isSelected: function () {
			return this.selected;
		},
		getNum: function () {
			return this.con;
		},
		update: function () {
			this.animators.for(function(a){
				a.update();
			},this);
			if (this.errando > 0) {
				this.borderColor = 'red';
				this.errando -= 1;
				if (this.errando <= 0) {
					this.errando = 0;
					this.unSelect();
				}
			}
		},
		draw: function () {
			if (this.visivel) {
				var ctx = srv.get('ctx');
				// padding branco
				ctx.fillStyle = this.borderColor;
				ctx.fillRect(this.x,this.y,this.w,this.h);

				// interior azul.
				ctx.fillStyle = colorPrimary;
				ctx.fillRect(this.x+this.borderSize,this.y+this.borderSize,this.w-this.borderSize*2,this.h-this.borderSize*2);

				ctx.font="italic 20px Verdana";
				ctx.textAlign = 'center';
				ctx.fillStyle = 'white';
				ctx.fillText(this.con.toString(),this.x+this.w/2,this.y+this.h/2+7.5);
			}
		},
		errou: function (){
			this.errando = 500/updateTime;
		},
		select: function () {
			this.selected = true;
			this.borderColor = colorPrimary;
		},
		unSelect: function () {
			this.selected = false;
			this.borderColor = 'white';
		},
		show: function () {
			this.visivel = true; // colocar timer para animar o estado.
		},
		hide: function () {
			this.visivel = false;
		},
		acima: function () {
			this.y = this.y-this.h-this.m*2;
		},
		abaixo: function () {
			this.animY.sum(this.h+this.m*2);
		},
		abaixoInst: function (){
			this.y = this.y+this.h+this.m*2;
		},
		direita: function () {
			this.x = this.x+this.w+this.m*2;
		},
		esquerda: function () {
			this.x = this.x-this.w-this.m*2;
		},
		move: function(px,py){
			this.animX.sum((this.w+this.m*2)*px);
			this.animY.sum((this.h+this.m*2)*py);
		},
		stopMove: function(){
			this.animX.stop();
			this.animY.stop();
		}
	});

	var TableModel = OOP.create(EventDispatcher,{
		initialize: function(x,y,w,h) {
			this.$super.initialize();
			this.resize(x,y,w,h);
		},
		isAnimando: function(){
			return this.animations.round(0) != 0;
		},
		beforeAnimation: function(){
			if (this.animations.round(0) == 0) {
				this.animations = this.animations.round(0);
				console.log('table before');
				this.dispatchEvent('beforeAnimation');
			}
			this.animations++;
		},
		afterAnimation: function(){
			this.animations--;
			if (this.animations.round(0) == 0) {
				this.animations = this.animations.round(0);
				console.log('table after');
				this.dispatchEvent('afterAnimation');
			}
		},
		getBlocks: function(){
			return this.blocks;
		},
		resize: function (x,y,w,h){
			console.log('table resize');

			this.blocks = [];
			this.selects = [];
			
			this.x = x;
			this.y = y;
			this.w = w;
			this.h = h;

			this.qtdX = (this.w/56).round(0);
			this.qtdY = (this.h/56).round(0);
			this.animations = 0;
			this.cols = [];
			for (var i = 0; i < this.qtdX; i++) {
				this.cols.push([]);
			}

			var qtdX = this.qtdX;
			var qtdY = this.qtdY;

			if ((w > h && this.qtdX < this.qtdY) || 
				(w < h && this.qtdX > this.qtdY)) {
				this.qtdX = qtdY;
				this.qtdY = qtdX;
			}

			this.bm = 2;
			this.bx = x+this.bm;
			this.by = y+this.bm;
			this.bw = (w-this.bm*2)/this.qtdX;
			this.bh = (h-this.bm*2)/this.qtdY;
			this.bw = this.bw-this.bm*2;
			this.bh = this.bh-this.bm*2;

		},
		remItem: function (item) {
			this.cols.for(function (col,index) {
				var i = col.indexOf(item);
				if (i > -1) {
					col.splice(i,1);
					for (var j = i - 1; j >= 0; j--) {
						col[j].abaixo();
					}
					return true;
				}
			}, this);
		},
		norm: function () {
			var blocks = this.blocks;
			var m = this.bm;
			var x = this.bx;
			var y = this.by;
			var w = this.bw;
			var h = this.bh;

			var questions = srv.get('questionBuilder');

			var b = null;
			this.cols.for(function (col,i) {
				var added = [];
				for (var j = this.qtdY - col.length - 1; j >= 0; j--) {
					var b = new Block(questions.get(((Math.random()*(questions.length()-1)).round(0))));
					b.addEventListener('beforeAnimation',this.beforeAnimation);
					b.addEventListener('afterAnimation',this.afterAnimation);
					b.setX(x+m+((w+m*2)*i));
					b.setY(y+m);
					b.setW(w);
					b.setH(h);
					b.setM(m);
					col.unshift(b);
					blocks.unshift(b);
					added.unshift(b);
				}
				added.for(function (b,j){
					for (var i = j; i < added.length; i++) {
						b.acima();
						b.abaixo();
					}
					if (j > 0) {
						for (var i = 0; i < j; i++) {
							b.abaixo();
						}
					}
				});
			},this);
		},
		click: function(e){
			var mu = srv.get('mouseUtils');
			this.blocks.for(function (block) {
				if (mu.entre(block.getX(),
					block.getY(),
					block.getW(),
					block.getH(),
					e.offsetX,
					e.offsetY)) {
					if (block.isSelected()) {
						block.unSelect();
						this.selects.splice(this.selects.indexOf(block),1);
					} else {
						block.select();
						this.selects.push(block);
					}
					if (this.selects.length == 3) {
						var oper = srv.get('questionBuilder').getOper();
						var a = this.selects[0].getNum();
						var b = this.selects[1].getNum();
						var c = this.selects[2].getNum();
						if ((oper == '+' && (a + b == c || b + c == a || c + a == b))
							||(oper == '-' && (a - b == c))
							||(oper == 'x' && (a * b == c || b * c == a || c * a == b))
							||(oper == '/' && (a / b == c))) {
							this.selects.for(function (b) {
								b.hide();
								this.remItem(b);
							},this);
							this.selects = [];
						} else {
							this.selects.pop();
							block.unSelect();
							block.errou();
						}
					}
					return true;
				}
			}, this);
			this.blocks = this.blocks.filter(function (b) { return b.isVisivel(); });
			this.norm();
		},
		update: function(){
			this.blocks.for(function (block) {
				block.update();
			},this);
		},
		draw: function(){
			var animando = [];
			this.blocks.for(function (block) {
				if (block.isAnimando()) animando.unshift(block);
				else block.draw();
			},this);
			animando.for(function(b){
				b.draw();
			},this);
			this.selects.for(function(b){
				b.draw();
			},this);
		}
	});

	var MenuTable = OOP.create(EventDispatcher,{
		initialize: function(x,y,w,h){
			this.$super.initialize();
			this.icVoltar = document.createElement('img');
			this.icVoltar.src = 'material/ic_arrow_back_white_24dp.png';
			this.defDims(x,y,w,h);
		},
		defDims: function(x,y,w,h){
			this.x = x;
			this.y = y;
			this.w = w;
			this.h = h;
			this.p = 7;

			this.icVoltar.width = 24;
			this.icVoltar.height = 24;
			this.icVoltar.left = this.x+this.p*2;
			this.icVoltar.top = this.y+this.p+this.icVoltar.height/2/2;
		},
		resize: function(x,y,w,h){
			this.defDims(x,y,w,h);
		},
		update: function(){},
		draw: function(){
			var ctx = srv.get('ctx');
			
			ctx.shadowColor = 'black';
			ctx.shadowBlur = 10;
			ctx.fillStyle = colorPrimary;
			ctx.fillRect(this.x,this.y,this.w,this.h);
			CtxUtils.resetShadown(ctx);
			
			ctx.drawImage(this.icVoltar,this.icVoltar.left,this.icVoltar.top);

			var oper = srv.get('questionBuilder').getOper();
			var tab = srv.get('questionBuilder').getTab();
			var label = null;
			if (oper == '+') label = 'Soma';
			if (oper == '-') label = 'Subtração';
			if (oper == 'x') label = 'Multiplicação';
			if (oper == '/') label = 'Divisão';
			label = tab + ' - ' + label;

			ctx.font = '25px Arial';
			ctx.textAlign = 'center';
			ctx.fillStyle = 'white';
			ctx.fillText(label,this.x+this.w/2,this.y+this.h/2+this.h/6);
		},
		click: function(e){
			var mu = srv.get('mouseUtils');
			if (mu.entre(this.icVoltar.left,
					this.icVoltar.top,
					this.icVoltar.width,
					this.icVoltar.height,
					e.offsetX,
					e.offsetY)) {
				this.dispatchEvent('openHome');
			}
		}
	});

	var Table = OOP.create(EventDispatcher,{
		initialize: function (x,y,w,h) {
			this.$super.initialize();
			this.defDims(x,y,w,h);
			var $self = this;
			this.menu = new MenuTable(x,y,w,this.y-this.p);
			this.menu.addEventListener('openHome',
				function(){
					$self.dispatchEvent('openHome');
				});
			this.table = new TableModel(this.x,this.y,this.w,this.h);	
		},
		defDims: function(x,y,w,h){
			var p = 5;
			var pxw = p;
			var py = p*11;
			this.p = p;
			this.x = x+pxw;
			this.y = y+py;
			this.w = w-pxw*2;
			this.h = h-py-p;
		},
		resize: function (x,y,w,h) {
			this.defDims(x,y,w,h);
			this.menu.resize(x,y,w,this.y-this.p);
			this.table.resize(this.x,this.y,this.w,this.h);
			this.table.norm();
		},
		update: function () {
			this.menu.update();
			this.table.update();
		},
		draw: function () {
			this.menu.draw();

			//var ctx = srv.get('ctx');
			//ctx.fillStyle = 'white';
			//ctx.fillRect(this.x,this.y,this.w,this.h);
			
			this.table.draw();
		},
		click: function (e) {
			this.menu.click(e);
			this.table.click(e);
		},
		touch: function(e){}
	});

	var View = OOP.create(EventDispatcher,{
		initialize: function(parent,x,y,w,h){
			this.$super.initialize();
			this.parent = parent;
			this.resize(x,y,w,h);
		},
		setParent: function(view){
			this.parent = view;
		},
		getParent: function(){
			return this.parent;
		},
		dispatchEvent: function(eventName,arg){
			this.$super.dispatchEvent(eventName,arg);
			if (this.getParent() != null) this.getParent().dispatchEvent(eventName,arg);
		},
		resize: function(x,y,w,h){
			this.x = x;
			this.y = y;
			this.w = w;
			this.h = h;
		},
		setX:function(x){
			this.x = x;
		},
		getX:function(){
			return this.x;
		},
		setY:function(y){
			this.y = y;
		},
		getY:function(){
			return this.y;
		},
		setW: function(w){
			this.w = w;
		},
		getW: function(){
			return this.w;
		},
		setH: function(h){
			this.h = h;
		},
		getH: function(){
			return this.h;
		},
		update: function(){},
		draw: function(){},
		click: function(e){},
		touch: function(e){}
	});

	var ScrollView = OOP.create(View,{
		initialize: function(x,y,w,h){
			this.$super.initialize(null,x,y,w,h);
			this.isVScroll = false;
			this.isHScroll = false;
			this.scV = 0;
		},
		setView: function(view){
			this.view = view;
			this.resize(this.getX(),this.getY(),this.getW(),this.getH());
		},
		resize:function(x,y,w,h){
			this.$super.resize(x,y,w,h);
			this.view.resize(x,this.limitViewY(this.view.getY()),w,h);

			if (this.view.getH() > this.getH()) this.isVScroll = true;
			if (this.view.getW() > this.getW()) this.isHScroll = true;

			this.btnW = 5;
			this.btnX = this.getX()+this.getW()-this.btnW;
			this.btnY = 0;
			this.btnD = this.view.getH()-this.getH();
			this.btnH = this.getH()-this.btnD < 20 ? 20 : this.getH()-this.btnD;
			this.btnB = this.getH()-this.btnH;

			this.positioneBtn();
		},
		limitViewY: function(y){
			var relativeY = y-this.getY();
			y = relativeY;
			if (y < -this.btnD) y = -this.btnD;
			y = y + this.getY();
			if (y > this.getY()) y = this.getY();
			return y;
		},
		resetEmbalo: function (){
			this.scV = 0;
			this.scD = 0.2;// 10% de desaceleração.
		},
		positioneBtn: function(){
			var relativeY = this.view.getY()-this.getY();
			var y = relativeY;
			y = -y;
			y = y/this.btnD*this.btnB;
			y = y < relativeY ? relativeY : y; // validando mínimo.
			var limit = y+this.getH()-this.btnH;
			y = y > limit ? limit : y; // validando máximo.
			this.btnY = y+this.getY();
			this.btnTimer = updateTime*2;
		},
		update:function(){
			this.view.update();
			if (this.btnTimer > 0) {
				this.btnTimer -= 1;
				if (this.btnTimer < 0) this.btnTimer = 0;
			}
			if (this.scV.abs() > 3) {
				var y = this.view.getY()+this.scV;
				y = this.limitViewY(y);
				this.view.resize(this.view.getX(),y,this.view.getW(),this.view.getH());
				this.scV -= this.scV * this.scD;
				this.positioneBtn();
			}
			if (this.scV.abs() <= 3) {
				this.resetEmbalo();
			}
		},
		draw:function(){
			this.view.draw();
			var ctx = srv.get('ctx');
			if (this.btnTimer > 0) {
				ctx.globalAlpha = 0.35;
				ctx.fillStyle = colorPrimary;
				ctx.fillRect(this.btnX,this.btnY,this.btnW,this.btnH);
				ctx.globalAlpha = 1.0;
			}
		},
		click:function(e){
			this.view.click(e);
		},
		touch:function(e){
			if (this.isVScroll) {
				if (e.type == 'touchstart') {
					this.resetEmbalo();
					this.clientY = e.changedTouches.item(0).clientY;
					this.gesto = {
						pYIni: this.clientY,
						tIni: new Date().getTime()
					};
				} else if (e.type == 'touchmove') {
					// Impedir scroll fora da área utilizar MouseUtils.entre(x,y,w,h).
					var clientY = e.changedTouches.item(0).clientY;
					var dif = clientY-this.clientY;
					this.clientY = clientY;

					var y = this.view.getY()+dif;
					y = this.limitViewY(y);
					this.view.resize(this.view.getX(),y,this.view.getW(),this.view.getH());

					this.positioneBtn();
				} else if (e.type == 'touchend') {
					var pYIni = this.gesto.pYini;
					var pYFin = e.changedTouches.item(0).clientY;
					var p = pYFin-this.gesto.pYIni;
					var tIni = this.gesto.tIni;
					var tFin = new Date().getTime();
					var t = tFin-tIni;
					var v = p/t*updateTime; // velocidade.
					// limitar gestos pequenos ao efeito.
					if (v.abs()/updateTime*1000 < 480 || p.abs() < 30) v = 0;
					this.scV = v;
				}
			}
		}
	});

	var Button = OOP.create(View,{
		initialize: function(parent,label){
			this.$super.initialize(parent,0,0,0,0);
			this.label = label;
		},
		getLabel: function(){
			return this.label;
		},
		draw: function(){
			var ctx = srv.get('ctx');

			var btn = this;
			
			ctx.fillStyle = colorPrimary;
			ctx.shadowColor = '#59595C';
			ctx.shadowBlur = 2;
			ctx.shadowOffsetX = 0;
			ctx.shadowOffsetY = 2;
			ctx.fillRect(btn.getX(),btn.getY(),btn.getW(),btn.getH());
			CtxUtils.resetShadown(ctx);
			
			ctx.fillStyle = 'white';
			ctx.textAlign = 'center';
			ctx.font = '20px Arial';
			ctx.fillText(btn.label,btn.getX()+btn.getW()/2,btn.getY()+btn.getH()/2+btn.getH()/6);
		},
		click: function(e){
			var mu = srv.get('mouseUtils');
			var btn = this;
			if (mu.entre(btn.getX(),
				btn.getY(),
				btn.getW(),
				btn.getH(),
				e.offsetX,
				e.offsetY)) {
				btn.dispatchEvent('click',this);
			}
		}
	});

	var ButtonTab = OOP.create(Button,{
		initialize: function(parent,label){
			this.$super.initialize(parent,label);
		},
		draw: function(){
			var ctx = srv.get('ctx');

			var btn = this;
			
			ctx.fillStyle = colorPrimary;
			ctx.strokeStyle = colorPrimary;

			//ctx.shadowColor = '#59595C';
			//ctx.shadowBlur = 2;
			//ctx.shadowOffsetX = 0;
			//ctx.shadowOffsetY = 2;
			
			ctx.beginPath();
			ctx.lineWidth = 10;
			ctx.arc(this.getX()+this.getW()/2, this.getY()+this.getH()/2, this.getW()/2, 0, 2 * Math.PI);
			ctx.fill();
			ctx.closePath();

			ctx.fillStyle = 'white';
			ctx.textAlign = 'center';
			ctx.font = 'bold 50px Arial';
			ctx.fillText(btn.getLabel(),this.getX()+this.getW()/2,(this.getY()+this.getH()/2)+50*0.3);
			
			CtxUtils.resetShadown(ctx);
		},
	});

	var Home = OOP.create(View,{
		initialize: function(parent,x,y,w,h){
			//h = h+20;// simular caso em que ele define sua propria altura.
			this.$super.initialize(parent,x,y,w,h);
			var $self = this;

			this.tabs = [];
			for (var i = 2; i <= 9; i++) {
				this.tabs.push(new ButtonTab(this,i+'+'));
				this.tabs.push(new ButtonTab(this,i+'-'));
				this.tabs.push(new ButtonTab(this,i+'x'));
				this.tabs.push(new ButtonTab(this,i+'/'));
			}

			this.tabs.for(function(btn){
				btn.addEventListener('click',
					function(){
						$self.dispatchEvent('openTable',btn);
					});
			},this);

			this.defDims(x,y,w,h);
		},
		defDims: function(x,y,w,h){
			var btnW = 100;
			var btnH = 100;
			var btnXL = (w+x)*0.10;
			var btnXR = (w+x)*0.90-btnW;
			var paddingTop = 40;
			var paddingBottom = 40;
			
			this.$super.resize(x,y,w,h=paddingTop+btnW*this.tabs.length+paddingBottom);//h=y+paddingTop+btnVGap*9+btnW*9);

			this.tabs.for(function(btn,i){
				var x = i % 2 == 0 ? btnXL : btnXR;
				btn.resize(x,y+paddingTop+i*btnW,btnW,btnH);
			},this);
		},
		resize: function(x,y,w,h){
			this.defDims(x,y,w,h=this.getH());
		},
		update: function(){},
		draw: function(){
			var ctx = srv.get('ctx');
			ctx.fillStyle = 'white';
			ctx.fillRect(this.getX(),this.getY(),this.getW(),this.getH());

			var drawPathLR = function(btn1,btn2){
				ctx.beginPath();
				ctx.lineWidth = 10;
				ctx.strokeStyle = colorPrimary;
				ctx.moveTo(btn1.getX()+btn1.getW()/2,btn1.getY()+btn1.getH()/2);
				ctx.lineTo(btn2.getX()+btn2.getW()/2,btn2.getY()+btn2.getH()/2);
				ctx.stroke();
				ctx.closePath();
			};

			var drawPathRL = function(btn1,btn2){
				ctx.beginPath();
				ctx.lineWidth = 10;
				ctx.strokeStyle = colorPrimary;
				ctx.moveTo(btn1.getX()+btn1.getW()/2,btn1.getY()+btn1.getH()/2);
				ctx.lineTo(btn2.getX()+btn2.getW()/2,btn2.getY()+btn2.getH()/2);
				ctx.stroke();
				ctx.closePath();
			};

			for (var i = 0; i < this.tabs.length - 1; i++) {
				var btn1 = this.tabs[i];
				var btn2 = this.tabs[i+1];
				if (i % 2 == 0) {
					drawPathLR(btn1,btn2);
				} else {
					drawPathRL(btn1,btn2);
				}
			}

			this.tabs.for(function(btn){
				btn.draw();
			},this);
		},
		click: function(e){
			this.tabs.for(function(btn){
				btn.click(e);
			},this);
		}
	});

	var Game = OOP.create({
		initialize: function (w,h) {
			this.defDims(w,h);

			var $self = this;

			var scView = new ScrollView(this.x,this.y+50,this.w,this.h-50);
			var scResize = scView.resize;
			scView.resize = function (x,y,w,h) {
				scResize(x,y+50,w,h-50);
			};
			var home = new Home(scView,this.x,this.y,this.w,this.h);
			scView.setView(home);

			this.home = scView;
			this.home.addEventListener('openTable',
				function(btn){
					var qb = new QuestionBuilder(btn.getLabel().substr(1,1),parseInt(btn.getLabel().substr(0,1)));
					srv.put('questionBuilder',qb);
					$self.view = $self.table;
					$self.resize($self.w,$self.h);
				});

			this.table = new Table(this.x,this.y,this.w,this.h);
			this.table.addEventListener('openHome',
				function(){
					$self.view = $self.home;
					$self.resize($self.w,$self.h);
				});
			
			this.view = this.home;
		},
		defDims: function (w,h) {
			this.x = 0;
			this.y = 0;
			this.w = w;
			this.h = h;
		},
		resize: function (w,h){
			this.defDims(w,h);
			this.view.resize(this.x,this.y,this.w,this.h);
		},
		start: function () {
			var that = this;
			var upd = function () {
				that.update();
				that.updateHnd = setTimeout(upd,updateTime);
			};
			this.updateHnd = setTimeout(upd,updateTime);
			var drw = function () {
				that.draw();
				that.drawHnd = setTimeout(drw,fps);
			};
			this.drawHnd = setTimeout(drw,fps);
		},
		pause: function () {},
		stop: function () {
			clearTimeout(this.updateHnd);
			clearTimeout(this.drawHnd);
		},
		update: function () {
			this.view.update();
		},
		draw: function () {
			var ctx = srv.get('ctx');
			ctx.clearRect(this.x, this.y, this.w, this.h);
			ctx.fillStyle = colorPrimary;
			ctx.fillRect(this.x,this.y,this.w,this.h);

			this.view.draw();

			if (this.view == this.home) {
				ctx.shadowColor = '#59595C';
				ctx.shadowBlur = 2;
				ctx.shadowOffsetX = 0;
				ctx.shadowOffsetY = 2;

				ctx.fillStyle = colorPrimary;
				ctx.fillRect(this.x,this.y,this.w,50);
				CtxUtils.resetShadown(ctx);

				ctx.font = '30px Arial';
				ctx.textAlign = 'center';
				ctx.fillStyle = 'white';
				ctx.fillText('Tabu Game',this.x+this.w/2,this.y+30+30/6);
			}
		},
		click: function (e) {
			this.view.click(e);
		},
		touch: function(e){
			this.view.touch(e);
		}
	});

	var q = document.querySelector.bind(document);

	var body = q('body');
	var canvas = document.createElement('canvas');
	canvas.id = 'game_canvas';

	var defCanvasWH = function(w,h) {
		canvas.width = w;
		canvas.height = h;
	};
	defCanvasWH(body.clientWidth,body.clientHeight);

	body.appendChild(canvas);
	srv.add('ctx', canvas.getContext('2d'));
	
	var g = new Game(canvas.width,canvas.height);

	canvas.addEventListener('click', function(e){
		//console.log('click');
		g.click.call(g,e);
	});
	canvas.addEventListener('touchstart',function(e){
		//console.log('touchstart');
		g.touch.call(g,e);
	});
	canvas.addEventListener('touchcancel',function(e){
		//console.log('touchcancel');
		g.touch.call(g,e);
	});
	canvas.addEventListener('touchmove',function(e){
		//console.log('touchmove');
		g.touch.call(g,e);
		e.stopPropagation();
		e.preventDefault();
	});
	canvas.addEventListener('touchend',function(e){
		//console.log('touchend');
		g.touch.call(g,e);
	});

	var getW = function(){
		return screen.width;
	};
	var getH = function(){
		return screen.height;
	};
	var sw = getW();
	var sh = getH();
	var resize = function () {
		if ((getW() == sh && getH() == sw)
			|| (getW() == sw && getH() == sh)) {
			console.log('start resizing',getW(),getH());
			defCanvasWH(body.clientWidth,body.clientHeight);
			g.resize(canvas.width,canvas.height);
			console.log('finally resizing');
		}
	};
	
	window.addEventListener('resize',function(){
		console.log('resize',getW(),getH());
		resize();
	});

	window.addEventListener('load', function () {
		g.start.call(g);
	});

})();