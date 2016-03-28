#!/bin/sh

echo -e "Content-type: application/json\r\n\r\n"

# QUERY PARAMS
CMD=`echo "$QUERY_STRING" | grep -oE "(^|[?&])cmd=[^&]+" | sed "s/%20/ /g" | cut -f 2 -d "=" | sed -e 's/  *$//'`
CH=`echo "$QUERY_STRING" | grep -oE "(^|[?&])ch=[^&]+" | sed "s/%20/ /g" | cut -f 2 -d "=" | sed -e 's/  *$//'`
SERVER=`echo "$QUERY_STRING" | grep -oE "(^|[?&])server=[^&]+" | sed "s/%20/ /g" | cut -f 2 -d "=" | sed -e 's/  *$//'`
STREAM=`echo "$QUERY_STRING" | grep -oE "(^|[?&])stream=[^&]+" | sed "s/%20/ /g" | cut -f 2 -d "=" | sed -e 's/  *$//'`

# PATHS
DIR=/home/
STORE=${DIR}web/html/data/data.ini
AVWORKER=avworker-min

_get() {
	if [ -f ${STORE} ]; then
		source ${STORE}
		echo "{\"success\":true, \"data\":{\"CH\":\"${CH}\",\"SERVER\":\"${SERVER}\",\"STREAM\":\"${STREAM}\"}}"
	else
		echo '{"success":false}'
	fi
}


_set() {
	if [ "${CH}" == "" ] || [ "${SERVER}" == "" ] || [ "${STREAM}" == "" ]; then
		echo '{"success":false,"msg":"Streaming parameters not set."}'
		exit 0
	fi

	echo "CH=${CH}" > ${STORE}
	echo "SERVER=${SERVER}" >> ${STORE}
	echo "STREAM=${STREAM}" >> ${STORE}

	echo '{"success":true}'
}


_check() {
	PS=`ps | grep $AVWORKER | grep -v grep | head -n 1 | awk '{print $1}' | sed -e 's/  *$//'`

	if [ "${PS}" == "" ]; then
		echo '{"success":false,"msg":"Yi is not streaming."}'
	else
		CMDLINE=`cat /proc/${PS}/cmdline | tr '\000' ' '`
		CMD=`echo $CMDLINE | awk '{print $1}'`
		RTSP=`echo $CMDLINE | awk '{print $2}'`
		RTMP=`echo $CMDLINE | awk '{print $3}'`
		if [ `echo ${RTSP} | grep "ch0_0.h264"` ]; then
			msg="Yi is streaming HD to ${RTMP}."
		else
			msg="Yi is streaming SD to ${RTMP}."
		fi
		echo "{\"success\":true, \"data\":{\"cmd\":\"${CMD}\",\"RTSP\":\"${RTSP}\",\"RTMP\":\"${RTMP}\"},\"msg\":\"${msg}\"}"
	fi

}

_play() {
	killall ${AVWORKER}

	# to save some space, it will be restored by watch_process
	# This need to be fixed
	ifconfig lo up
	#killall monitor_wifi
	#killall exnet

	if [ "${CH}" != "" ] && [ "${SERVER}" != "" ] && [ "${STREAM}" != "" ]; then
		$(_set)
	else
		if [ -f ${STORE} ]; then
			source ${STORE}
		else
			echo '{"success":false}'
		fi
	fi

	if [ "${SERVER}" == "" ] || [ "${STREAM}" == "" ]; then
		echo '{"success":false,"msg":"Streaming parameters not set."}'
		exit 0
	fi

	if [ "${CH}" == "hd" ]; then
		RTSP="rtsp://127.0.0.1/ch0_0.h264"
	else
		RTSP="rtsp://127.0.0.1/ch0_1.h264"
	fi

	if [ `echo $SERVER | grep -o /$` == '/' ]; then
		RTMP=$SERVER$STREAM
	else
		RTMP=$SERVER/$STREAM
	fi

	CMD="nohup ${DIR}${AVWORKER} ${RTSP} ${RTMP} null &"
	eval "${CMD}" &>/dev/null &
	echo '{"success":true,"msg":"Streaming started."}'
}

_stop() {
	killall ${AVWORKER}

	echo '{"success":true,"msg":"Streaming stopped."}'
}

_stats() {
	ts1=`date "+%s"`
	rx1=`cat /sys/class/net/ra0/statistics/rx_bytes`
	tx1=`cat /sys/class/net/ra0/statistics/tx_bytes`

	sleep 1

	ts2=`date "+%s"`
	rx2=`cat /sys/class/net/ra0/statistics/rx_bytes`
	tx2=`cat /sys/class/net/ra0/statistics/tx_bytes`

	#echo 
	echo -e {\"ts1\":"${ts1}",\"ts2\":"${ts2}",\"rx1\":"${rx1}",\"rx2\":"${rx2}",\"tx1\":"${tx1}",\"tx2\":"${tx2}"}
}

case "$CMD" in

	_get )
		$CMD
		;;

	_set )
		$CMD
		;;

	_check )
		$CMD
		;;

	_play )
		$CMD
		;;

	_stop )
		$CMD
		;;

	_stats )
		$CMD
		;;

	* )
		echo {\"success\":false,\"msg\":\"Command unrecognized.\"}
		;;

esac

exit 0
