(function (){

	Array.prototype.for = function (callback,thisObj) {
		if (thisObj == null) thisObj = this;
		for (var i = 0; i < this.length; i++) {
			if (callback.call(thisObj,this[i],i,this)) break;
		}
	};
	HTMLElement.prototype.attr = function (name,value){
		if (value == null) {
			return this.getAttribute(name);
		}
		this.setAttribute(name,value);
	};
	Number.prototype.abs = function(){
		return Math.abs(this);
	};
	Number.prototype.round = function(scale) {
		return parseFloat(this.toFixed(scale));
	};

	var OOP = window.OOP = {};

	var extend = function(sup,sub,replace) {
		for (var p in sup) {
			if (typeof sup[p] == 'function') {
				if (sub[p] != null && !replace) continue;
				sub[p] = sup[p];
			}
		}
	};

	var defInst = function (def,inst){
		for (var p in def) {
			if (typeof def[p] == 'function') {
				if (p == 'initialize') { // Sinal de inicializada.
					var f = def[p].bind(inst);
					inst[p] = function(){
						inst.$initialized = true;
						f.apply(null,arguments);
					};	
					continue;
				}
				inst[p] = def[p].bind(inst);
			}
		}	
	};

	OOP.create = function (superType,def) {
		var extending = arguments.length == 2;
		var construct = function ($self){
			if (extending) {
				var $super = {};
				superType.$constructor($super);
				extend($super,$self);
				$self.$super = $super;
			} else {
				def = superType;
			}
			defInst(def,$self);
		};
		var klass = function (){
			var $self = {};
			construct($self);
			extend($self,this,true);
			if (this.initialize != null) {
				this.initialize.apply(null,arguments);
				delete this.initialize;
			}
			// validar aqui se o os initializers dos supers foram chamados.
			var cur = $self;
			while (cur != null) {
				if (cur.initialize != null && !cur.$initialized) throw new Error('Construtor definido em umas das classes da ierarquia não foi chamado.');
				cur = cur.$super;
			}
		};
		klass.$constructor = construct;
		return klass;
	};

})();

/*
var BrunoX = OOP.create({
	initialize: function (c) {
		console.log('initialize Bruno');
		console.log(this);
		this.name = 'Bruno Moreira Mota';
		this.name += c;
	},
	getName: function () {
		console.log(this);
		return this.name;
	},
	setName: function (name) {
		this.name = name;
	}
});

var BrunoX2 = OOP.create(BrunoX,{
	initialize: function (c) {
		console.log('initialize Bruno2');
		console.log(this);
		this.name = 'bruno2';
		this.idade = 23;
		this.$super.initialize(c);
	},
	getIdade: function () {
		return this.idade;
	}
});

var BrunoX3 = OOP.create(BrunoX2,{
	initialize: function (c) {
		console.log('initialize Bruno3');
		console.log(this);
		this.cpf = '111.236.866-37';
		this.name = 'bruno3';
		this.$super.initialize(c);
	},
	getCPF: function (){
		return this.cpf;
	}
});

var BrunoX4 = OOP.create(BrunoX3,{
	initialize: function (c) {
		this.$super.initialize(c);
		this.end = 'rua ' + c;
	},
	getEnd: function () {
		return this.end;
	}
});
*/