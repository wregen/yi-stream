TaskRunner = function (interval) {
    interval = interval || 1000;
    var tasks = [],
            removeQueue = [],
            id = 0,
            running = false,
            // private
            stopThread = function () {
                running = false;
                clearInterval(id);
                id = 0;
            },
            // private
            startThread = function () {
                if (!running) {
                    running = true;
                    id = setInterval(runTasks, interval);
                }
            },
            // private
            removeTask = function (t) {
                removeQueue.push(t);
                if (t.onStop) {
                    t.onStop.apply(t.scope || t);
                }
            },
            // private
            runTasks = function () {
                var rqLen = removeQueue.length,
                        now = new Date().getTime();

                if (rqLen > 0) {
                    for (var i = 0; i < rqLen; i++) {
                        tasks.remove(removeQueue[i]);
                    }
                    removeQueue = [];
                    if (tasks.length < 1) {
                        stopThread();
                        return;
                    }
                }
                for (var i = 0, t, itime, rt, len = tasks.length; i < len; ++i) {
                    t = tasks[i];
                    itime = now - t.taskRunTime;
                    if (t.interval <= itime) {
                        rt = t.run.apply(t.scope || t, t.args || [++t.taskRunCount]);
                        t.taskRunTime = now;
                        if (rt === false || t.taskRunCount === t.repeat) {
                            removeTask(t);
                            return;
                        }
                    }
                    if (t.duration && t.duration <= (now - t.taskStartTime)) {
                        removeTask(t);
                    }
                }
            };

    this.start = function (task) {
        tasks.push(task);
        task.taskStartTime = new Date().getTime();
        task.taskRunTime = 0;
        task.taskRunCount = 0;
        startThread();
        return task;
    };

    /**
     * Stops an existing running task.
     */
    this.stop = function (task) {
        removeTask(task);
        return task;
    };

    /**
     * Stops all tasks that are currently running.
     */
    this.stopAll = function () {
        stopThread();
        for (var i = 0, len = tasks.length; i < len; i++) {
            if (tasks[i].onStop) {
                tasks[i].onStop();
            }
        }
        tasks = [];
        removeQueue = [];
    };
};