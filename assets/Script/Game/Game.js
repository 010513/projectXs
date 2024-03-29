var Common = require("../Common/Common")
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
        this.mapMgr = this.getComponent("MapMgr");
        this.jieSuanNode = cc.find("Canvas/NodeJieSuan");
        this.UINode = cc.find("Canvas/UINode");
        this.btNode = cc.find("Canvas/Node_button");
        this.btBack = cc.find("bt_back",this.UINode);
        this.introduceNode = cc.find("Canvas/NodeIntroduce");
        this.lbHitRate = cc.find("Canvas/UINode/lb_hitValue").getComponent(cc.Label);
        //开启碰撞检测系统
        cc.director.getCollisionManager().enabled = true;
        //修改射击区域大小
        this.ShootTouchLeftNode = cc.find("Canvas/ShootTouchLeftNode");
        this.ShootTouchRightNode = cc.find("Canvas/ShootTouchRightNode");
        this.ShootTouchLeftNode.width = cc.winSize.width / 2;
        this.ShootTouchRightNode.width = cc.winSize.width / 2;
        //监听事件
        this.node.on("event_game_jiesuan",this._on_game_jiesuan,this);
        this.node.on("map_load_finish",this._mapLoadFinish,this);
        this.node.on("game_all_targets_clear",this._allTargetClear,this);
        this.node.on("game_set_hitrate",this._setHitRate,this);
        this.node.on("game_kill_target",this._killTarget,this);
        this.node.on("game_refresh",this._gameRefresh,this);
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
        this.isGameInit = false;
        this.isJieSuaning = false;
        this.spBg.position = cc.v2(0,0);
        this.gameLeiJiTime = 0;
        this.testBackClick = false;
    },

    update (dt) {
        if(this.isGameInit && !this.isJieSuaning){
            this._updateMonsters(dt);
        }
    },

    //根据怪物的配置数据，对怪物的定期刷新
    _updateMonsters : function(_dt){
        this.gameLeiJiTime += _dt;
        for(let k in this.uMonsterCfgData){
            let monsterData = this.uMonsterCfgData[k];
            if(monsterData.initGenTime > this.gameLeiJiTime * 1000){
                continue;
            }
            if(monsterData.updateDelta == undefined){
                //新增一个累计时间记录
                monsterData.updateDelta = 0;
                this._generateMonster(monsterData,50);
            }
            monsterData.updateDelta += _dt;
            if(monsterData.updateDelta > monsterData.refreshInteval && monsterData.refreshInteval != -1){
                //判断是否能同时存在
                if(monsterData.isCoexist){
                    //生成怪
                    this._generateMonster(monsterData,50);
                    //重置更新累计时间
                    monsterData.updateDelta = 0
                }
                else{
                    //判断场上是否有同类型怪
                }
            }
        }
    },

    _updateTimer : function(){
        if(this.isJieSuaning)
            return
        if(this.limitTime != undefined && this.limitTime > 0){
            this.limitTime--;
            this.lbLimitTime.string = this.limitTime;
            if(this.limitTime == 0){
                if(this.gqCfgData.gTargetType != 2){
                    cc.vv.gameNode.emit("event_game_jiesuan",{isSucc:false});
                }
                else{

                }
            }
        }
    },

    //刷新游戏
    refreshGame : function(){
        this.isGameInit = false;
        this.isJieSuaning = false;
        this.spBg.position = cc.v2(0,0);
        this.gameLeiJiTime = 0;
        this.limitTime = -1;
        this.limitBullet = -1;
        this.lbLimitMiss = -1;
        this.targetsMgr.refresh();
        this.shootCtrl.refresh();
        this._mapLoadFinish();
        for(let k in this.uMonsterCfgData){
            let monsterData = this.uMonsterCfgData[k];
            monsterData.updateDelta = undefined
        }
    },

    //初始化游戏
    _initGame : function(){
        this.UINode.active = true;
        for(let i = 1; i < 4; i++){
            cc.find("lbLimit" + i,this.UINode).active = false
        }
        //显示限制条件
        let limitIdx = 1;
        //限时
        if(this.gqCfgData.limitTime != -1){
            let path = "lbLimit" + limitIdx
            let nameNode = cc.find("lbLimit" + limitIdx,this.UINode)
            let lbName = nameNode.getComponent(cc.Label);
            nameNode.active = true;
            lbName.string = cc.vv.i18n.t("game_time")
            this.lbLimitTime = cc.find(path + "/lbLimitValue",this.UINode).getComponent(cc.Label);
            this.limitTime = this.gqCfgData.limitTime;
            this.lbLimitTime.string = this.limitTime;
            limitIdx++;
        }
        //限制子弹
        if(this.gqCfgData.limitBullet != -1){
            let path = "lbLimit" + limitIdx
            let nameNode = cc.find("lbLimit" + limitIdx,this.UINode)
            let lbName = nameNode.getComponent(cc.Label);
            nameNode.active = true;
            lbName.string = cc.vv.i18n.t("bullet_count")
            this.lbLimitBullet = cc.find(path + "/lbLimitValue",this.UINode).getComponent(cc.Label);
            this.limitBullet = this.gqCfgData.limitBullet;
            this.lbLimitBullet.string = this.limitBullet
            limitIdx++;
        }
        //失误限制
        if(this.gqCfgData.limitMissCount != -1){
            let path = "lbLimit" + limitIdx
            let nameNode = cc.find("lbLimit" + limitIdx,this.UINode)
            let lbName = nameNode.getComponent(cc.Label);
            nameNode.active = true;
            lbName.string = cc.vv.i18n.t("miss_count")
            this.lbLimitMiss = cc.find(path + "/lbLimitValue",this.UINode).getComponent(cc.Label);
            this.limitMiss = this.gqCfgData.limitMissCount;
            limitIdx++;
        }
        //开启一个一秒执行一次的定时器，用作倒计时
        this.schedule(this._updateTimer,1);
        this.isGameInit = true;
        this.shootCtrl.setCanShoot(true);
        //如果是要塞模式，生成一个要塞
        if(this.gqCfgData.gTargetType == 4){
            this.mapMgr.generateFort(this.taskParam[0])
        }
    },

    //显示关卡任务介绍
    _showTaskIntroduce : function(){
        this.introduceNode.active = true;
        this.introduceNode.opacity = 255;
        this.UINode.active = false;
        let lbContent = cc.find("lbIntroduce",this.introduceNode).getComponent(cc.Label);
        let nLimitTime = cc.find("lbLimitTime",this.introduceNode);
        let nBullet = cc.find("lbBullet",this.introduceNode);
        let content = "";
        if(this.gqCfgData.gTargetType == 1){
            let targetId = this.taskParam[0]
            let MonsterData = cc.vv.dataMgr.getMonsterCfgDataById(targetId);
            let name = cc.vv.i18n.t("target" + MonsterData.monsterType);
            content = cc.vv.i18n.t("game_task_info_content1")
            content = Common.stringFormat(content,name,this.taskParam[1]);
            lbContent.string = content;
            content = cc.vv.i18n.t("limit_time")
            if(this.gqCfgData.limitTime > 0 ){
                content = Common.stringFormat(content,this.gqCfgData.limitTime + cc.vv.i18n.t("second"));
            }
            else{
                content = Common.stringFormat(content,'不限');
            }
            nLimitTime.getComponent(cc.Label).string = content;
            content = cc.vv.i18n.t("limit_bullet")
            if(this.gqCfgData.limitBullet > 0 ){
                content = Common.stringFormat(content,this.gqCfgData.limitBullet + cc.vv.i18n.t("count"));
            }
            else{
                content = Common.stringFormat(content,'不限');
            }
            nBullet.getComponent(cc.Label).string = content;
        }
        let ac1 = cc.fadeOut(5);
        let ac2 = cc.callFunc(function(){
            this._initGame();
        }, this, "");
        let ac3 = cc.sequence(ac1,ac2);
        this.introduceNode.runAction(ac3)
    },

    //判断是否达到胜利条件
    //p1:是否发送结算
    _isWin : function(_isEmit){
        if(cc.vv.sceneParam.gameMode == "test")
            return;
        if(_isEmit == undefined)
            _isEmit = true;
        let ret = false;
        if(this.gqCfgData.gTargetType == 1){        //射击指定数量目标
            let id = parseInt(this.taskParam[0]);
            let count = this.taskParam[1]
            let beKilledCount = this.targetsMgr.getBeKillCountById(id);
            if(beKilledCount >= count){
                ret = true;
            }
        }
        else if(this.gqCfgData.gTargetType == 2){   //坚持X秒
            if(this.limitTime <= 0){
                ret = true;
            }
        }
        else if(this.gqCfgData.gTargetType == 3){   //  完美射击
            if(this.shootCtrl.perfectShootCount >= this.taskParam[0] ){
                ret = true;
            }
        }
        else if(this.gqCfgData.gTargetType == 4){   // 守护要塞
            
        }
        if(ret && _isEmit)
            cc.vv.gameNode.emit("event_game_jiesuan",{isSucc:true});
        return ret
    },

    //判断是否触发失败条件
    _isLose : function(){

    },

    //根据配置设置目标移动信息
    _setTargetMovePosData : function(_tarCtrl,_monsterData){
        let arr = [];
        let movePosData = cc.vv.dataMgr.getMovPosCfgDataById(_monsterData.movePosID);
        let startPos = movePosData.movegenPos.split(',');
        let startPosV2 = cc.v2(parseInt(startPos[0]),parseInt(startPos[1]));
        _tarCtrl.node.position = startPosV2;
        arr.push(_tarCtrl.node.position);
        let movemidPos = movePosData.movemidPos;
        if(movemidPos != -1){
            let movemidPos = movemidPos.split(';');
            for(let i in movemidPos){
                let v = movemidPos[i];
                let pos = String(v).split(',');
                let posV2 = cc.v2(parseInt(pos[0]),parseInt(pos[1]));
                arr.push(posV2);
            }
        }
        
        let endPos = movePosData.movEndPos.split(',');
        let endPosV2 = cc.v2(parseInt(endPos[0]),parseInt(endPos[1]));
        arr.push(endPosV2);
        _tarCtrl.setMoveArray(arr);
    },

    _generateMonster : function(_monsterData,_radius){
        if(_monsterData.monsterType == Common.TargetType.ShortTerm){
            this.mapMgr.generateTermTargetsNearShootPos(_monsterData.monsterId,_radius,1,Common.TargetType.ShortTerm,_monsterData.timer);
        }
        else if(_monsterData.monsterType == Common.TargetType.LongTerm){
            this.mapMgr.generateTermTargetsNearShootPos(_monsterData.monsterId,_radius,1,Common.TargetType.LongTerm);
        }
        else if(_monsterData.monsterType == Common.TargetType.RandomMove){
            let tarCtrl = this.mapMgr.generateMoveTargetNearShootPos(Common.TargetType.RandomMove,_radius,_monsterData.speed,150);
            tarCtrl.setId(_monsterData.monsterId);
        }
        else if(_monsterData.monsterType == Common.TargetType.HideRandomMove){
            let tarCtrl = this.mapMgr.generateMoveTargetNearShootPos(Common.TargetType.HideRandomMove,_radius,_monsterData.speed,150);
            tarCtrl.setShowAndHideTime(_monsterData.showDelta,_monsterData.hideDelta);
            tarCtrl.setId(_monsterData.monsterId);
        }
        else if(_monsterData.monsterType == Common.TargetType.IntRandomMove){
            let tarCtrl = this.mapMgr.generateMoveTargetNearShootPos(Common.TargetType.IntRandomMove,_radius,_monsterData.speed,150);
            tarCtrl.setMoveAndStopTime(_monsterData.stopInterval,_monsterData.stopDelta);
            tarCtrl.setId(_monsterData.monsterId);
        }
        else if(_monsterData.monsterType == Common.TargetType.Move){
            let tarCtrl = this.mapMgr.generateMoveTargetNearShootPos(Common.TargetType.Move,_radius,_monsterData.speed,150);
            this._setTargetMovePosData(tarCtrl,_monsterData)
            tarCtrl.setId(_monsterData.monsterId);
        }
        else if(_monsterData.monsterType == Common.TargetType.HideMove){
            let tarCtrl = this.mapMgr.generateMoveTargetNearShootPos(Common.TargetType.HideMove,_radius,_monsterData.speed,150);
            this._setTargetMovePosData(tarCtrl,_monsterData)
            tarCtrl.setShowAndHideTime(_monsterData.showDelta,_monsterData.hideDelta);
            tarCtrl.setId(_monsterData.monsterId);
        }
        else if(_monsterData.monsterType == Common.TargetType.SplitMove){
            let tarCtrl = this.mapMgr.generateMoveTargetNearShootPos(Common.TargetType.SplitMove,_radius,_monsterData.speed,150);
            tarCtrl.setId(_monsterData.monsterId);
        }
        else if(_monsterData.monsterType == Common.TargetType.People){
            let tarCtrl = this.mapMgr.generateMoveTargetNearShootPos(Common.TargetType.People,_radius,_monsterData.speed,150);
            tarCtrl.setId(_monsterData.monsterId);
        }
        else if(_monsterData.monsterType == Common.TargetType.SpyMove){
            let tarCtrl = this.mapMgr.generateMoveTargetNearShootPos(Common.TargetType.SpyMove,_radius,_monsterData.speed,150);
            tarCtrl.setSpyAndManTime(_monsterData.manShowInterval,_monsterData.manShowDelta);
            tarCtrl.setId(_monsterData.monsterId);
        }
        else if(_monsterData.monsterType == Common.TargetType.AttFort){
            let shootCtrl = this.shootNode.getComponent("ShootController");
            let pos = shootCtrl.getShootPoint();
            this.mapMgr.generateAttFortTargetNearFort(_monsterData.monsterId,_radius,_monsterData.speed,pos,_monsterData.movePosID,_monsterData.genPos);
        }
    },

    //初始化关卡数据
    _initTaskData : function(){
        this.guanQiaId = cc.vv.sceneParam.id;
        /** this.gqCfgData 数据结构
         *  {
            "gId": 1011,
            "gTargetType": 1,   1为射击指定数量的目标(ID,数量) 2为坚持X秒(秒) 3为完成X次完美射击(数量) 4为守护要塞(堡垒id)
            "typeParam": "10001,10",
            "limitTime": 120,   限时
            "limitBullet": -1,  子弹限制
            "limitTarget": -1,  限制目标(平民ID)
            "limitMissCount": -1,   失误次数上限
            "limitDisappear": -1,   限制消失（怪物id,怪物id）
            "uMonsterId": 101,  怪物集id
            "uManId": -1,       平民集id
            "uSupplyId": -1,    补给集id
            "goldAward": 50     获得奖励
            },
         */
        this.gqCfgData = cc.vv.dataMgr.getGuanQiaCfgDataById(this.guanQiaId);
        this.taskParam = this.gqCfgData.typeParam.toString().split(',');   //不同任务类型有不同的参数
        /**
         * {
            "uMonsterId": 101,
            "monsterId": 10001,
            "img": "",
            "monsterType": 1,
            "initGenTime": 0,
            "isCoexist": 1,
            "refreshInteval": 3,
            "isRefreshDied": 0,
            "isGenOnStart": 0,
            "genPos": 0,
            "movEndPos": -1,
            "timer": -1,
            "initHideTime": -1,
            "hideDelta": -1,
            "showDelta": -1,
            "initStop": -1,
            "stopInterval": -1,
            "stopDelta": -1,
            "speed": -1,
            "isSplit": 0,
            "childId": -1,
            "initManTime": -1,
            "manShowDelta": -1,
            "manShowInterval": -1,
            "manShowCount": -1,
            "monsterHp": 1
        },
         */
        if(this.gqCfgData.gTargetType == 4){
            //守护要塞模式
            this.cfgFortData = cc.vv.dataMgr.getFortCfgDataById(this.taskParam[0]);
            this.cfgFortData.uMonsterId = this.cfgFortData.uMonsterId.toString().split(',');    //字符串转换成数组
            this.uMonsterCfgData = cc.vv.dataMgr.getMonsterCfgDataByUid(this.cfgFortData.uMonsterId[0]); //怪物集配置数据
        } 
        else{
            this.uMonsterCfgData = cc.vv.dataMgr.getMonsterCfgDataByUid(this.gqCfgData.uMonsterId); //怪物集配置数据
        }
        this.uMenCfgData = cc.vv.dataMgr.getMenCfgDataByUid(this.gqCfgData.uManId); //平民集配置数据
        this.uSupplyCfgData = cc.vv.dataMgr.getSupplyCfgDataByUid(this.gqCfgData.uSupplyId);    //补给集配置数据
        
    },

    //操作测试
    _testGame : function() {
        //生成10个长期驻守目标
        this.mapMgr.generateTermTargetsNearShootPos(10001,50,10,Common.TargetType.LongTerm,-1,0);
    },

    //------------------------------------------------------------监听事件Begin-------------------------------

    //地图管理控件加载完毕
    _mapLoadFinish : function(){
        if(cc.vv.sceneParam.gameMode == "test"){
            //为操控的游戏测试模式
            this.btNode.active = false;
            this.btBack.active = true;
            this._testGame();
        }
        else if(cc.vv.sceneParam.gameMode == "guanka"){
            //this.btNode.active = true;
            this.btBack.active = false;
            this._initTaskData();
            this._showTaskIntroduce();
        }
    },

      //所有目标被清空
    _allTargetClear : function(){
        if(cc.vv.sceneParam.gameMode == "test" && this.testBackClick == false){
            this._testGame();
        }
    },

    //设置命中率,子弹数量
    _setHitRate : function(){
        if(cc.vv.sceneParam.gameMode == "test")
            return;
        this.lbHitRate.string = this.shootCtrl.getHitRate() + "%"
        //是否限制子弹,是则修改子弹数量
        if(this.gqCfgData.limitBullet > 0){
            let leftBullet = this.limitBullet - this.shootCtrl.shootCount;
            leftBullet = leftBullet < 0 ? 0 : leftBullet;
            this.lbLimitBullet.string = leftBullet;
            if(leftBullet <= 0){
                this.shootCtrl.setCanShoot(false);
                if(leftBullet <= 0 && !this._isWin(false)){
                    //是否限制子弹，是否在成功前就已经没有子弹了
                    cc.vv.gameNode.emit("event_game_jiesuan",{isSucc:false});
                }
            }
        }
    },

    _on_game_jiesuan: function (event) {
        let param = event;
        this.isJieSuaning = true
        let jieSuanUI = this.jieSuanNode.getComponent('JieSuan');
        jieSuanUI.showJieSuan(param.isSucc,this.guanQiaId);
        this.UINode.active = false;
        this.targetsMgr.removeAllTargets();
        if(param.isSucc)
            cc.vv.dataMgr.saveGuanQiaById(this.guanQiaId)
    },


    //击杀一个目标后通知
    _killTarget : function(event){
        let param = event;
        this.shootCtrl.killTarget();
        if(!this._isWin()){
            for(let k in this.uMonsterCfgData){
                let v = this.uMonsterCfgData[k];
                if(v.monsterId == event.monsterId){
                    if(v.isRefreshDied){
                        v.updateDelta = undefined;//设置为undefiend后，updateMonster中就会调用生成，相当于立即刷新
                    }
                }
            }
        }
    },

    //刷新游戏
    _gameRefresh : function(event){
        this.refreshGame();
    },


     //------------------------------------------------------------监听事件End------------------------------------



    //---------------------------------------------------点击事件回调begin-----------------------------------------

    onRestartClick:function(event, customEventData){
        //this.jieSuanNode.active = false;
        //this.UINode.active = true;
        this.spBg.position = cc.v2(0,0)        
        cc.director.loadScene("loginScene");
    },

    onBackClick : function(event, customEventData){
        this.testBackClick = true;
        this.targetsMgr.removeAllTargets();
        cc.vv.sceneParam.showLayer = "opSetting";
        cc.director.loadScene("loginScene");
    },
    
    //--------------------------------------------------点击事件回调End----------------------------------------------
});
