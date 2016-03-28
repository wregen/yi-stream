    $.cfg = function() {
        "use strict";
        var prefix = '/cgi/cmd.cgi?cmd=';
        return {
            url: {
                get: prefix + '_get',
                set: prefix + '_set',
                check: prefix + '_check',
                play: prefix + '_play',
                stop: prefix + '_stop',
                stats: prefix + '_stats'
            },
            obj: {
                log: $('#log'),
                form: $('#stream-form'),
                formServer: $('#server'),
                formStream: $('#stream'),
                formChSd: $('#chsd'),
                formChHd: $('#chhd'),
                formInputs: $('#stream-form :input[id!=chhd]'),
                controlButton: $('#control-button'),
                monitor: $('#monitor')
            },
            date: {
                format: {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                }
            },
            monitor: {
                iteration: 10,
                data: [],
                rxs: [
                    [0, 0],
                    [1, 0],
                    [2, 0],
                    [3, 0],
                    [4, 0],
                    [5, 0],
                    [6, 0],
                    [7, 0],
                    [8, 0],
                    [9, 0]
                ],
                txs: [
                    [0, 0],
                    [1, 0],
                    [2, 0],
                    [3, 0],
                    [4, 0],
                    [5, 0],
                    [6, 0],
                    [7, 0],
                    [8, 0],
                    [9, 0]
                ],
                options: {
                    colors: ["#ff8809", "#115fa6"],
                    shadowSize: 1,
                    series: {
                        lines: {
                            show: true,
                            fill: true,
                            lineWidth: 4
                        },
                        points: {
                            show: false
                        }
                    },
                    grid: {
                        show: true,
                        color: "#adadad",
                        backgroundColor: "#fff",
                        borderColor: "#ccc",
                        borderWidth: 0
                    },
                    xaxis: {
                        show: false
                    },
                    legend: {
                        backgroundOpacity: 1
                    }
                }
            }
        };
    }();

    $.camera = function() {
        "use strict";
        var taskRunner = new TaskRunner(),
            canStartCheckStatusTask = true,
            checkStatusTask = {
                run: function() {
                    if (canStartCheckStatusTask) {
                        $.camera.checkStatus();
                    }
                },
                interval: 15000
            },
            canStartMonitorTask = true,
            monitorTask = {
                run: function() {
                    if (canStartMonitorTask) {
                        $.camera.monitorRun();
                    }
                },
                interval: 2000
            };

        return {
            formSetDisabled: function(value) {
                this.config.obj.formInputs.prop("disabled", value);
            },
            monitorRun: function() {
                var me = this,
                    placeholder = me.config.obj.monitor;
                ++me.config.monitor.iteration;
                canStartMonitorTask = false;
                $.ajax({
                    url: me.config.url.stats,
                    method: 'GET',
                    dataType: 'json'
                }).done(function(res) {
                    var rx = ((res.rx2 - res.rx1) * 8) / 1000,
                        tx = ((res.tx2 - res.tx1) * 8) / 1000,
                        ts = res.ts2 * (1000 * me.config.monitor.iteration);

                    me.config.monitor.rxs.shift();
                    me.config.monitor.txs.shift();
                    me.config.monitor.rxs.push([me.config.monitor.iteration, rx]);
                    me.config.monitor.txs.push([me.config.monitor.iteration, tx]);

                    me.config.monitor.data = [{
                        label: "&nbsp;&nbsp;OUT (kbps)",
                        data: me.config.monitor.txs
                    }, {
                        label: "&nbsp;&nbsp;IN (kbps)",
                        data: me.config.monitor.rxs
                    }];
                    $.plot(placeholder,
                        me.config.monitor.data,
                        me.config.monitor.options);
                    canStartMonitorTask = true;
                });
            },
            monitorSetup: function() {
                var placeholder = this.config.obj.monitor,
                    data = this.config.monitor.data,
                    options = this.config.monitor.options;
                $.plot(placeholder, data, options);
                taskRunner.start(monitorTask);
            },
            log: function(value) {
                var cv = this.config.obj.log.html(),
                    cd = new Date(),
                    cdd = cd.toLocaleTimeString("en-US", this.config.date.format),
                    cvd = cv.length > 512 ? '' : cv,
                    cvd = cvd.length == 0 ? cvd : cvd + '\n',
                    res = [cvd, cdd, ' - ', value].join('');

                this.config.obj.log.html(res);
            },
            checkStatus: function() {
                var me = this;
                canStartCheckStatusTask = false;
                $.ajax({
                    type: 'GET',
                    url: me.config.url.check,
                    dataType: 'json'
                }).done(function(res) {
                    if (res.success === true) {
                        me.setControlButton('stop');
                    } else {
                        me.setControlButton('play');
                    }
                    me.log(res.msg);
                    canStartCheckStatusTask = true;
                });
            },
            setControlButton: function(status) {
                var me = this,
                    btn = me.config.obj.controlButton;
                if (me.config.obj.formServer.val() !== '' && me.config.obj.formStream.val() !== '') {
                    btn.prop("disabled", false);
                }
                if (status === 'stop') {
                    btn.html('Stop streaming');
                    btn.data('action', 'stop');
                } else {
                    btn.html('Start streaming');
                    btn.data('action', 'play');
                }
            },
            controllButtonAction: function() {
                var btn = $(this);
                btn.prop("disabled", true);
                if (btn.data('action') == 'stop') {
                    $.camera.stop();
                } else {
                    $.camera.play();
                }
            },
            stop: function() {
                var me = this;
                me.formSetDisabled(true);
                $.ajax({
                    type: 'GET',
                    url: me.config.url.stop
                }).done(function(res) {
                    me.formSetDisabled(false);
                    if (res.success == true) {
                        me.checkStatus();
                        me.log(res.msg || 'stop cmd: ok');
                    } else {
                        me.log(res.msg || 'stop cmd: nook');
                    }
                });
            },
            play: function() {
                var me = this,
                    data = [
                        '&',
                        'server=', me.config.obj.formServer.val(),
                        '&',
                        'stream=', me.config.obj.formStream.val(),
                        '&',
                        'ch=', (me.config.obj.formChHd.prop('checked') ? 'hd' : 'sd')
                    ].join('');
                me.formSetDisabled(true);
                $.ajax({
                    type: 'GET',
                    url: me.config.url.play + data,
                }).done(function(res) {
                    me.formSetDisabled(false);
                    if (res.success == true) {
                        me.checkStatus();
                        me.log(res.msg || 'stop cmd: ok');
                    } else {
                        me.log(res.msg || 'stop cmd: nook');
                    }
                });
            },
            loadForm: function() {
                var me = this;
                $.ajax({
                    type: 'GET',
                    url: me.config.url.get
                }).done(function(res) {
                    me.formSetDisabled(false);
                    if (res.success == true) {
                        me.config.obj.formServer.val(res.data.SERVER);
                        me.config.obj.formStream.val(res.data.STREAM);
                        if (res.data.CH === "hd") {
                            me.config.obj.formChHd.prop('checked', true);
                        } else {
                            me.config.obj.formChSd.prop('checked', true);
                        }
                        me.log('Form data loaded.');
                    } else {
                        me.log(res.msg || 'get cmd: nook');
                    }
                });
            },
            init: function(config) {
                this.config = config;
                this.loadForm();
                taskRunner.start(checkStatusTask);
                this.monitorSetup();
                this.config.obj.controlButton.click(this.controllButtonAction);
            }
        }
    }();

    $(function() {
        "use strict";
        $.camera.init($.cfg);
    });
