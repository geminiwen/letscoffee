$(document).ready(function(){
    var maxstrlen = 140;
    var fansListData = [];
    var localStorage = window.localStorage;

    WB2.login(function(){
        $('.hidden').show();
        WB2.anyWhere(function(W){
            W.parseCMD("/account/get_uid.json",function(sResult,bStatus){
                if( !bStatus ) return;
                var uid = sResult['uid'];
                W.parseCMD("/users/show.json",function(sResult,bStatus){
                    var screenName = sResult['screen_name'];
                    $('.username').show();
                    $('#username').text(screenName);
                    $('#uid_text').val(screenName);
                    var url = "http://weibo.com/" + sResult['profile_url'];
                },{
                    uid: uid
                },{
                    method:"get"
                });
            },{},{
                method:'get'
            });
        });
    });

    $('#username').click(function(){
        // Load native UI library
        var gui = require('nw.gui');

        var win = gui.Window.get();
        WB2.logout(function(){
            win.reload();
        });
        return false;
    });

    $('#weibo_text').on("keyup change click",function(){
        var wordLength = getStrLen($('#extra_content').val() + $(this).val());
        $('#info').text("已经输入" + wordLength + "字");
    });

    $('#extra_content').on("keyup change click",function(){
        var wordLength = getStrLen($('#extra_content').val() + $("#weibo_text").val());
        $('#info').text("已经输入" + wordLength + "字");
    });

    var getStrLen = function (str) {
        var myLen = 0;
        for (var i = 0; (i < str.length) && (myLen <= maxstrlen * 2); i++) {
            myLen++;
        }
        return myLen;
    }

    $('#fans_list').on('click','.fans',function() {
        var appendTo = $(this).data("value");
        var text = $('#weibo_text').val();
        text += "@"+ appendTo + " ";
        $('#weibo_text').val(text);
        var wordLength = getStrLen($('#extra_content').val() + text);
        $('#info').text("已经输入" + wordLength + "字");
    });

    var dragStart = function() {
       $('.delete_box').fadeIn();
    }

    var dragEnd = function() {
       $('.delete_box').fadeOut();
    }

    $('#send_to_btn').click(function(){
        var weiboId = $('#weibo_id').val();
        if( weiboId === '' ) {
            alert("微博ID为空");
            return false;
        }

        var text = $('#extra_content').val() + $('#weibo_text').val();
        var length = getStrLen(text);
        if( length > maxstrlen ) {
            $('#info').text("字数太长啦！");
            return false;
        }

        $('#info').text("发送中");
        text = encodeURI(text);

        WB2.anyWhere(function(W){
            W.parseCMD("/statuses/repost.json", function(sResult,bStatus) {
                if(bStatus) {
                    $('#info').text("发送成功");
                } else {
                    $('#info').text("发送失败");
                }
            },{
                id: weiboId,
                status: text,
                is_comment: 0
            },{
                method: "post"
            });
        });
        return false;
    });

    $('#comment_to_btn').click(function(){
        var weiboId = $('#weibo_id').val();
        if( weiboId === '' ) {
            alert("微博ID为空");
            return false;
        }

        var text = $('#extra_content').val() + $('#weibo_text').val();
        var length = getStrLen(text);
        if( length > maxstrlen ) {
            $('#info').text("字数太长啦！");
            return false;
        }

        $('#info').text("发送中");
        text = encodeURI(text);

        WB2.anyWhere(function(W){
            W.parseCMD("/comments/create.json", function(sResult,bStatus) {
                if(bStatus) {
                    $('#info').text("发送成功");
                } else {
                    $('#info').text("发送失败");
                }
            },{
                id: weiboId,
                comment: text
            },{
                method: "post"
            });
        });
        return false;
    });

    var getMoreFans = function(uid,cursor,total,ulNode) {
        if( cursor === 0 ) {
            $('#info').text("加载完成，粉丝数:"+total);
            var fansJSONStr = JSON.stringify(fansListData);
            return;
        }
        WB2.anyWhere(function(W){
            W.parseCMD("/friendships/followers.json", function(sResult, bStatus){
                if( !bStatus ) return;
                var listNode = $('<div class="fans"></div>');
                    var userLength = sResult.users.length;
                    var users = sResult.users;
                    for(var i = 0; i < userLength; i++ ) {
                        var perNode = listNode.clone();
                        var screenName = users[i].screen_name;
                        perNode.text(screenName);
                        fansListData.push(screenName);
                        perNode.data("value",screenName);
                        perNode.appendTo(ulNode);
                }
                getMoreFans(uid,sResult['next_cursor'],sResult["total_number"],ulNode);
            },{
                screen_name: uid,
                count: 200,
                cursor: cursor
            },{
                method: 'get'
            });
        });
    }

    var getFansFromStorage = function() {
        var userLength = fansListData.length;
        var fansList = $('#fans_list').html('');
        var users = fansListData;
        var listNode = $('<div class="fans"></div>');
        for(var i = 0; i < userLength; i++ ) {
            var perNode = listNode.clone();
            var screenName = users[i];
            perNode.text(screenName);
            perNode.data("value",screenName);
            perNode.appendTo(fansList);
        }
        $('.send').removeAttr("disabled");

    };

    $('#get_fans_btn').click(function(){
        var uid = $('#uid_text').val();
        if( uid == '' ) {
            alert("UID为空");
            return false;
        }

        var getFansFromRemote = function(){
            $('#info').text("获取中");
            WB2.anyWhere(function(W){
                W.parseCMD("/friendships/followers.json", function(sResult, bStatus){
                    if( !bStatus ) return;
                    fansListData = [];
                    var fansList = $('#fans_list').html('');
                    var listNode = $('<div class="fans"></div>');
                    var userLength = sResult.users.length;

                    var users = sResult.users;
                    for(var i = 0; i < userLength; i++ ) {
                        var perNode = listNode.clone();
                        var screenName = users[i].screen_name;
                        perNode.text(screenName);
                        fansListData.push(screenName);
                        perNode.data("value", screenName);
                        perNode.appendTo(fansList);
                    }
                    getMoreFans(uid,sResult['next_cursor'],sResult["total_number"],fansList);
                },{
                    screen_name: uid,
                    count: 200
                },{
                    method: 'get'
                });
            });
        };
        getFansFromRemote();
        return false;
    });


    var autoSendInterval;
    var timerInterval;

    var TIME_INTERVAL = 60;

    var timer = 0;
    var fansIndex = 0;

    var autoSendProcess = function(content) {
        var weiboId = $('#weibo_id').val();
        if( weiboId == '' ) {
            alert("微博ID为空");
            $('#stop_send_btn').click();
            return ;
        }

        var text = content + $('#weibo_text').val();
        var length = getStrLen(text);
        if( length > maxstrlen ) {
            $('#info').text("字数太长啦！");
            $('#stop_send_btn').click();
            return ;
        }

        $('#info').text("发送中");
        text = encodeURI(text);

        WB2.anyWhere(function(W){
            W.parseCMD("/statuses/repost.json", function(sResult,bStatus) {
                if(bStatus) {
                    $('#info').text("发送成功");
                } else {
                    $('#info').text("发送失败");
                    $('#stop_send_btn').click();
                }
            },{
                id: weiboId,
                status: text,
                is_comment: 0
            },{
                method: "post"
            });
        });
    }

    $('#auto_send_btn').click(function(){
        clearInterval(autoSendInterval);
        clearInterval(timerInterval);
        fansIndex = 0;
        TIME_INTERVAL = $('#time_interval').val();
        TIME_INTERVAL = parseInt(TIME_INTERVAL);
        if( TIME_INTERVAL < 30 || TIME_INTERVAL == NaN ) {
            TIME_INTERVAL = 30;
        }
        timer = TIME_INTERVAL;

        $(this).attr("disabled","disabled");
        $('#stop_send_btn').removeAttr("disabled");

        var contentList = localStorage.getItem("content_list");
        contentList = contentList || '[]';
        contentList = JSON.parse(contentList);
        var contentListLength = contentList.length;
        autoSendInterval = setInterval(function(){
            $('#weibo_text').val('');
            var length = $('#fans_list > .fans').length;
            if( fansIndex == length ) {
                clearInterval(autoSendInterval);
                clearInterval(timerInterval);
                fansIndex = 0;
                autoSendInterval = undefined;
                timerInterval = undefined;
                $('#info').text("全部发送完成");
                return ;
            }
            for(var i = 0 ; i < 5 && fansIndex < length; i++, fansIndex++) {

                 $('#fans_list > .fans').eq(fansIndex).click();
            }
            if( contentListLength == 0 ) {
                clearInterval(autoSendInterval);
                clearInterval(timerInterval);
                fansIndex = 0;
                autoSendInterval = undefined;
                timerInterval = undefined;
                $('#info').text('没有任何内容可以发送');
                return ;
            }


            var contentIndex = randomer(contentListLength);
            autoSendProcess(contentList[contentIndex]);
            timer = TIME_INTERVAL;
        },TIME_INTERVAL* 1000);

        timerInterval = setInterval(function(){
            $('#info').text("下一次发送时间大约还有："+timer--+"秒。");
            if( timer < 0 ) {
                timer = 0;
            }
        },1000);
        return false;
    });

    var deleteItem = function( $item ) {
        var data = $item.data("value");
        fansListData = _.reject(fansListData,function(d) { return d == data; });
        $item.remove();
    }
    $('#fans_list').sortable({start:dragStart,stop:dragEnd });
    $('#delete_box').droppable({
        accept:"div.fans",
        drop: function( event, ui ) {
            deleteItem(ui.draggable);
        }
    });

    $('#stop_send_btn').click(function(){
        clearInterval(autoSendInterval);
        clearInterval(timerInterval);
        fansIndex = 0;
        autoSendInterval = undefined;
        timerInterval = undefined;
        $(this).attr("disabled","disabled");
        $('#auto_send_btn').removeAttr("disabled");
        $('#info').text("已停止发送");
        return false;
    });

    $('#export_fans_btn').click(function(){
        var elem = $('<input type="file" nwsaveas>');
        var fs = require("fs-extra");
        elem.click();
        elem.on("change",function(e){
            var path = e.currentTarget.files[0].path;
            var fansListToFile = fansListData.join("\r\n");
            fs.outputFile(path,fansListToFile,function(err){
                if(err) {
                    $('#info').text("导出失败：" + err);
                } else {
                    $('#info').text("导出成功");
                }
            });
        });
        return false;
    });

    $('#import_fans_btn').click(function(){
        var elem = $('<input type="file" >');
        var fs = require("fs-extra");
        elem.click();
        elem.on("change",function(e){
            var path = e.currentTarget.files[0].path;
            fs.readFile(path, 'utf8', function(err, data) {
                if(err) {
                    $('#info').text("导入错误");
                } else {
                    data = data.replace(/^\uFEFF/, '');
                    fansListData = data.split("\r\n");
                    getFansFromStorage();
                    $('#info').text("导入成功");
                }

            })
        });
        return false;
    });


    $('#content_list_add_btn').click(function(){
        var value =  $('#extra_content').val();
        if( !value || value === '' ) {
            $('#info').text("添加失败，内容不够");
            return false;
        }
        var option = $('<option></option>');
        option.val(value);
        option.text(value);
        option.appendTo($('#extra_content_list'));

        var list = localStorage.getItem("content_list");
        list = list || '[]';
        list = JSON.parse(list);
        list.push(value);
        list = JSON.stringify(list);
        localStorage.setItem("content_list",list);
        $('#info').text("添加成功");

        return false;
    });

    $('#content_list_show_btn').click(function(){
        $('.extra_content_list_box').fadeIn();
        return false;
    })

    $('#content_list_close_btn').click(function(){
        $('.extra_content_list_box').fadeOut();
        return false;
    });

    $('#content_list_delete_btn').click(function(){
       var value =  $('#extra_content_list').val();
       if( !value || value === '') {
           alert('请选择一项');
           return false;
       }
       $("option[value="+value+"]").remove();
       var list = localStorage.getItem("content_list");
       list = list || '[]';
       list = JSON.parse(list);
       list = _.reject(list,function(i) { return i === value });
       list = JSON.stringify(list);
       localStorage.setItem("content_list",list);

        $('#info').text("删除成功");
       return false;
    });

    $('#extra_content_list').on('dblclick',function(){
        var value = $(this).val();
        $('#extra_content').val(value);
        $('.extra_content_list_box').fadeOut();
        return false;
    });

    var list = localStorage.getItem("content_list");
    list = list || '[]';
    list = JSON.parse(list);
    var option = $('<option></option>');
    _.each(list,function(e,i){
        var o = option.clone();
        o.val(e);
        o.text(e);
        o.appendTo($('#extra_content_list'));
    });


    var randomer = function(length) {
        return  Math.floor(Math.random() * length);
    }

});
