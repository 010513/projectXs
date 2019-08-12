var Common = require("Common")
//const i18n = require('LanguageData');

cc.Class({
    extends: cc.Component,

    properties: {
        spBg : cc.Node,
        shootNode : cc.Node,
        initCount: 4,   //初始化生成个数
        generateDelta:1,    //每过多长时间生成1个
    },

    // LIFE-CYCLE CALLBACKS:
    onLoad () {
        //
       // i18n.init( cc.sys.language)
        cc.vv.gameNode = this.node;
        //cc.game.setFrameRate(45);
        this.targetsMgr = this.getComponent("TargetsMgr");
        this.shootCtrl = this.shootNode.getComponent("ShootController");
        this.mapMgr = this.spBg.getComponent("MapMgr");
        this.jieSuanNode = cc.find("Canvas/NodeJieSuan");
        this.UINode = cc.find("Canvas/UINode");
        this.btNode = cc.find("Canvas/Node_button");
        this.lbHitRate = cc.find("Canvas/UINode/lb_hitValue").getComponent(cc.Label);
        //开启碰撞检测系统
        cc.director.getCollisionManager().enabled = true;

        //修改射击区域大小
        this.ShootTouchLeftNode = cc.find("Canvas/ShootTouchLeftNode");
        this.ShootTouchRightNode = cc.find("Canvas/ShootTouchRightNode");
        this.ShootTouchLeftNode.width = cc.winSize.width / 2;
        this.ShootTouchRightNode.width = cc.winSize.width / 2;
        //监听时间
        this.node.on("event_gameover",this._on_gameOver,this);
        this.node.on("map_load_finish",this._mapLoadFinish,this);
        this.node.on("game_all_targets_clear",this._allTargetClear,this);
        this.node.on("game_set_hitrate",this._setHitRate,this)
        //cc.director.getCollisionManager().enabledDebugDraw = true;
        //TEST模式
     },

    start () {
        if(cc.vv.dataMgr.opSetting.op == 0){
            //左手准星
            this.ShootTouchLeftNode.active = true;
            this.ShootTouchRightNode.active = false;
        }
        else{
            //右手准星
            this.ShootTouchLeftNode.active = false;
            this.ShootTouchRightNode.active = true;
        }
    },

    update (dt) {

    },

    //地图管理控件加载完毕
    _mapLoadFinish : function(){
        if(cc.vv.sceneParam.gameMode == "test"){
            //为操控的游戏测试模式
            this.btNode.active = false;
            this._testGame();
        }
    },

    //操作测试
    _testGame : function() {
        //生成10个长期驻守目标
        this.mapMgr.generateTermTargetsNearShootPos(50,10,Common.TargetType.LongTerm,-1,0);
    },

    //所有目标被清空
    _allTargetClear : function(){
        if(cc.vv.sceneParam.gameMode == "test"){
            this._testGame();
        }
    },

    //设置命中率
    _setHitRate : function(){
        this.lbHitRate.string = this.shootCtrl.getHitRate() + "%"
    },

    _on_gameOver: function () {
        this.jieSuanNode.active = true;
        this.UINode.active = false;
        this.targetsMgr.removeAllTargets();
    },

    onRestartClick:function(event, customEventData){
        //this.jieSuanNode.active = false;
        //this.UINode.active = true;
        this.spBg.position = cc.v2(0,0)        
        cc.director.loadScene("loginScene");
    },

    onBackClick : function(event, customEventData){
        this.targetsMgr.removeAllTargets();
        cc.vv.sceneParam.showLayer = "opSetting";
        cc.director.loadScene("loginScene");
    },
    
    onGenerateClick:function(event, customEventData){
        if(customEventData == Common.TargetType.ShortTerm){
            this.mapMgr.generateTermTargetsNearShootPos(50,4,Common.TargetType.ShortTerm,10,0.2);
        }
        else if(customEventData == Common.TargetType.LongTerm){
            this.mapMgr.generateTermTargetsNearShootPos(50,4,Common.TargetType.LongTerm,-1,0.2);
        }
        else if(customEventData == Common.TargetType.RandomMove){
            this.mapMgr.generateMoveTargetNearShootPos(Common.TargetType.RandomMove,50,300,100);
        }
        else if(customEventData == Common.TargetType.HideRandomMove){
            let tarCtrl = this.mapMgr.generateMoveTargetNearShootPos(Common.TargetType.HideRandomMove,50,300,100);
            tarCtrl.setShowAndHideTime(5,3);
        }
        else if(customEventData == Common.TargetType.IntRandomMove){
            let tarCtrl = this.mapMgr.generateMoveTargetNearShootPos(Common.TargetType.IntRandomMove,50,300,100);
            tarCtrl.setMoveAndStopTime(5,1.5);
        }
        else if(customEventData == Common.TargetType.Move){
            let tarCtrl = this.mapMgr.generateMoveTargetNearShootPos(Common.TargetType.Move,50,300,100);
            let arr = [];
            arr.push(tarCtrl.node.position);
            //随机生成三个点
            for(let i = 0; i < 3; i++){
                let x = Common.randomFrom(-1500,1500,true);
                let y = Common.randomFrom(-800,800,true);
                arr.push(cc.v2(x,y));
            }
            tarCtrl.setMoveArray(arr);
        }
        else if(customEventData == Common.TargetType.HideMove){
            let tarCtrl = this.mapMgr.generateMoveTargetNearShootPos(Common.TargetType.HideMove,50,300,100);
            let arr = [];
            arr.push(tarCtrl.node.position);
            //随机生成三个点
            for(let i = 0; i < 3; i++){
                let x = Common.randomFrom(-1500,1500,true);
                let y = Common.randomFrom(-800,800,true);
                arr.push(cc.v2(x,y));
            }
            tarCtrl.setMoveArray(arr);
            tarCtrl.setShowAndHideTime(5,3);
        }
        else if(customEventData == Common.TargetType.SplitMove){
            this.mapMgr.generateMoveTargetNearShootPos(Common.TargetType.SplitMove,50,150,100);
        }
        else if(customEventData == Common.TargetType.People){
            this.mapMgr.generateMoveTargetNearShootPos(Common.TargetType.People,50,300,100);
        }
        else if(customEventData == Common.TargetType.SpyMove){
            let tarCtrl = this.mapMgr.generateMoveTargetNearShootPos(Common.TargetType.SpyMove,50,300,100);
            tarCtrl.setSpyAndManTime(3,3);
        }
    },
});
