/*
* @des 表单验证jquery插件
* @author Tab
* @调用示例
	$('表单box').vForm({
		item: [
			['#ID', /^[\u0391-\uFFE5A-Za-z0-9]+$/],
			['[name="sex"]', 'email'],
			['#phone', function(input){
				return input.val().length === 11;
			}]
		]
	});
*/
define(function (require, exports, module) {

(function($){

	$.vForm = function(){};
	
	$.vForm.regxp = {
		//手机号码   /^(130|131|132|133|134|135|136|137|138|139|145|147|150|151|152|153|155|156|157|158|159|180|181|182|183|185|186|187|188|189)\d{8}$/
		//联通  /^1(30|31|32|33|34|35|36|37|38|39|47|50|51|52|53|55|56|57|58|59|80|81|82|83|84|85|86|87|88|89)\d{8}$/
		phone: /^1[3458]\d{9}$|^0\d{9,10}$/,
		//电话号码(3~4位区号-7~8位直播号-1到4位分机号,分机号不是必须)
		//telephone: /^\d{3,4}\-\d{7,8}(-\d{1,4}|)$/,
		telephone: /^[\d\s]+[\d-\s]*[\d\s]+$/, //松散验证
		//电话号码或手机号码
		//telephonephone: /(^\d{3,4}\-\d{7,8}(-\d{1,4}|)$)|(^1[3458]\d{9}$|^0\d{9,10}$)/,
		telephonephone: /(^1(30|31|32|33|34|35|36|37|38|39|47|50|51|52|53|55|56|57|58|59|80|81|82|83|84|85|86|87|88|89)\d{8}$)|(^\d{3,4}\-\d{7,8}(-\d{1,4}|)$)/, //联通或座机
		//名字(汉字&字母&数字)
		nickname: /^[\u0391-\uFFE5A-Za-z0-9]{4,20}$/,
		// /[.\n]*/ //所有(等同没验证)
		name: /[\u0391-\uFFE5A-Za-z0-9]{2,}/,
		//密码(数字/字母/特殊字符 6~18位)
		password: /^[\@A-Za-z0-9\!\#\$\%\^\&\*\.\~]{6,18}$/,
		//身份证号码(15位或者18位，15位时全为数字，18位前17位为数字，最后一位是校验位，可能为数字或字符X)
		idcard: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
	};
	
	//提示函数
	$.vForm.tips = function(b, target, msg, theme){
		var o = this.o || {};
		var parent = $('body');
		var tip = parent.find('.form_tip');
		o.tipsTheme = theme || o.tipsTheme;
		
		toBody_handle();
				
		//处理提示消息-插入到body的
		function toBody_handle(){
			tip = $('#form_tip_cover');
			if(!b){
				//show
				(!!target.length && (target[0].tagName === 'INPUT' || target[0].tagName === 'SELECT' || target[0].tagName === 'TEXTAREA')) && target.css({
					'border-color': '#e60012'
				});
				if(!tip.length){
					tip = appendTipToBody();
				}else{
					tip.show().html(msg);
				}
				setTimeout(function(){
					tip.hide();			
				}, 3*1000);
			}else{
				//hide
				target[0].tagName === 'INPUT' && target.removeAttr('style');
			}
		}
		
		//提示插入到body下
		function appendTipToBody(){
			!$('#form_tip_cover').length && $('body').append('<div class="form_tip" id="form_tip_cover">'+ msg +'</div>');
			var target = $('#form_tip_cover');
			return target.show().css({
				'margin-left': -target.width()/2,	
				'margin-top': -target.height()/2,
			});
		}
		
	};
	
	//清空tip
	$.vForm.clearTips = function(target, border){
		if(!target.length){
			return false;	
		}
		var parent = $('body');
		parent.find('.form_tip').remove();
		if(target.length && target[0].tagName === 'INPUT' && typeof(border) === 'undefined'){
			target.removeAttr('style');
		}
	};
	
	$.fn.vForm = function(opt){
		var o = $.extend({}, {
			//自定义规则
			//a)正则表达式
			//b)特定字符串
			//c)函数 一定得return
			item: [
				//格式：['#ID', 自定义规则]
			],
			regxp: $.vForm.regxp || {},
			//是否滚动至第一个未验证的节点坐标
			isGoAnchor: true,
			//提示风格 d/f
			tipsTheme: 'cover',
			//提示信息是否隐藏(特定条件)
			tipsHide: false,
			//额外的自定义函数验证(onsubmit)
			extra: function(){
				return true;	
			},
			//委托层
			delegate: 'body',
			//调用模式
			debug: 0,
			//验证通过执行的函数,默认false,提交表单
			submitCallback: false
		}, opt);
		
		var t = this;
		t.o = o;
		//初始边框样式
		t.inputborder = t.first().find('input[type="text"], input[type="password"]').first().css('border');
		//解禁提交按钮
		t.find('input[type="submit"]').removeAttr('disabled');
		
		//提示函数
		t.tips = $.vForm.tips;
		//清空tip
		t.clearTips = $.vForm.clearTips;
		
		//单个验证 return true/false
		t.verification = function(target, reg, nogetbodyerror){ //nogetbodyerror只对data-error有效
			var b;
			var val = $.trim(target.val());
			var errorFn = function(_b){
				if(!_b){
					//若当前节点没有data-error属性则到同级节点上取
					t.tips.call(t, _b, target, target.data('error') ? target.data('error'): target.siblings('[data-error]').data('error'));
				}else{
					t.tips.call(t, true, target);
				}
			};
			if(!val){
				//value为空时也提示
				//target.data('empty') && t.tips.call(t, false, target, target.data('empty'));
				//清空tips
				t.clearTips(target);
				if(target.data('empty')){
					return false;
				}else{
					return true;
				}
			}
			if(typeof(reg) === 'string'){
				b = o.regxp[reg].test(val);
				errorFn(b);
				return b;
			}else if(typeof(reg) === 'object'){
				b = reg.test(val);
				errorFn(b);
				return b;
			}else if(typeof(reg) === 'function'){
				b = reg(target, t);
				!nogetbodyerror && errorFn(b);
				return b;
			}
		};
		//事件绑定
		//绑定提交
		$(o.delegate).on('submit', t, function(e){
											   
			var _subbtn = t.find('input[type="submit"]').first();
			_subbtn.data('initval', _subbtn.val());
			
			if(!t.data('vStatus')){
				e.preventDefault();
				var ary = [];
				var n = 0;
				for(var _i = 0; _i < o.item.length; _i++){
					var _target = t.find(o.item[_i][0]);
					var reg = o.item[_i][1];
					!_target.hasClass('disabled') && ary.push(t.verification(_target, reg, o.item[_i][2]));
					if(o.debug){
						console.log(_target, t.verification(_target, reg, o.item[_i][2]));
					}
				}
				t.find('[data-empty]').not('.disabled').each(function(){
					var target = $(this);
					var val = $.trim(target.val());
					var b = (val !== '') && (target[0].tagName === 'SELECT' ? val != 0 : true);
					if(!b){
						t.tips.call(t, false, target, target.data('empty'));
					}else{
						target[0].tagName === 'SELECT' && t.clearTips(target);
					}
					ary.push(b);
				});
				for(var j = 0; j < ary.length; j++){
					if(!ary[j]){
						n += 1;
					}
				}
				var vfuc = o.extra(t);
				if(!n && vfuc){
					//验证通过
					//禁用按钮
					_subbtn.addClass('disabled').val('正在' + _subbtn.data('initval') + '...').attr('disabled', 'disabled');
					if(typeof(o.submitCallback) === 'function'){
						o.submitCallback(t, _subbtn, function(){
							_subbtn.removeClass('disabled').val(_subbtn.data('initval')).removeAttr('disabled');
						});
						setTimeout(function(){
							_subbtn.removeClass('disabled').val(_subbtn.data('initval')).removeAttr('disabled');			
						}, 1000*10); //10秒之后解禁按钮
					}else{
						t.data('vStatus', true).submit();
					}
				}else{
					//滚动至第一个未验证成功的节点 依赖 $.goAnchor插件
					if(o.tipsTheme !== 'art' && o.tipsTheme !== 'cover'){
						o.isGoAnchor && $.isFunction($.fn.goAnchor) && $(window).goAnchor({
							target: $('.form_tip_error').length && ($('.form_tip_error').first().offset().top - 150)
						});
					}
				}
				n = 0;
			}
		});
		//绑定blur
		for(var i = 0; i < o.item.length; i++){
			(function(_i){
				$(o.delegate).on('blur.item', o.item[i][0], function(){
					var target = $(this);
					var reg = o.item[_i][1];
					t.verification(target, reg, o.item[_i][2]);
				});
			})(i);
		}
		t.find('[data-empty]').not('[data-error]').each(function(){
			var self = $(this);
			$(o.delegate).on('blur.empty', self, function(){
				var target = $(this);
				var val = $.trim(target.val());
				if((val !== '') && (target[0].tagName === 'SELECT' ? val != 0 : true)){
					t.tips.call(t, true, target);
				}else{
					//value为空时也提示
					//t.tips.call(t, false, target, target.data('empty'));
					t.clearTips(target);
				}
			});							  
		});
	};

})($);

});