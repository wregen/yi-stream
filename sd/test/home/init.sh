killall telnetd
ifconfig eth0 down

if [ -f "/home/do_format" ]; then
	/home/format
fi

mkdir -p /tmp
mount tmpfs /tmp -t tmpfs -o size=32m

if [ -f "/home/RT2870STA.dat" ]; then
	cp /home/RT2870STA.dat /etc/Wireless/RT2870STA/
	sync
fi

rm /home/hd1 -r
rm /home/hd2 -r
mkdir -p /tmp/hd1/record
mkdir -p /tmp/hd1/record_sub
mkdir -p /tmp/hd2/record
mkdir -p /tmp/hd2/record_sub
ln -s /tmp/hd1 /home/hd1
ln -s /tmp/hd2 /home/hd2

mount -t vfat /dev/hd1 /home/hd1
rm /home/mmap_tmpfs/mmap.info

if [ -f "/home/hd1/test/equip_test.sh" ]; then
	/home/hd1/test/equip_test.sh
	exit
fi

if [ -f "/home/hd1/wpa_supplicant.conf1" ]; then
	cp /home/ui.conf_bak /etc/ui.conf
fi

export LD_LIBRARY_PATH=/home/libusr:$LD_LIBRARY_PATH
mv /home/default.script /usr/share/udhcpc -f

rm /etc/resolv.conf
ln -s /tmp/resolv.conf /etc/resolv.conf

/home/log_server &

cp /etc/wpa_supplicant.conf /home
mv /home/hd1/wpa_supplicant.conf /home
/home/crypt_file -d /home/hd1/crypt.bin /home/wpa_supplicant.conf
rm /home/hd1/crypt.bin
cp /home/hd1/wpa_supplicant.conf1 /home/wpa_supplicant.conf

cd /home
mount |grep "/tmp"
/home/productioninfoget.sh
insmod cpld_periph.ko

cd /home/3518
./load3518_audio -i

if [ -f "/home/notfirst" ]; then
	if [ -f "/home/wpa_supplicant.conf" ]; then
		echo " "
	else
		himm 0x20050074 0x06802424
		/home/rmm "/home/welcome.snd"
		/home/rmm "/home/start_wait.snd"
	fi
	/home/checkdisk
	rm /home/do_format
else
	if [ -f "/home/wpa_supplicant.conf" ]; then
		himm 0x20050074 0x06802424
		/home/rmm "/home/welcome.snd"
		/home/rmm "/home/start_wait.snd"
	fi
fi

/home/led_ctl -boff -yon &
insmod /home/mtprealloc7601Usta.ko
insmod /home/mt7601Usta.ko

ifconfig ra0 up

#if [ -f "/home/need_update" ]; then
#	/home/script/wificonn.sh 1
#	if [ -f "/tmp/gw1" ]; then
#	/home/need_update
#	fi
#fi

sysctl -w fs.mqueue.msg_max=256
mkdir /dev/mqueue
mount -t mqueue none /dev/mqueue

#insmod /home/cpld_wdg.ko
#insmod /home/cpld_periph.ko
#insmod /home/iap_auth.ko
/home/gethwplatform

#now begin app
   sysctl -w net.ipv4.tcp_mem='3072    4096    2000000'
   sysctl -w net.core.wmem_max='2000000'
   sysctl -w net.ipv4.tcp_keepalive_time=300 net.ipv4.tcp_keepalive_intvl=6 net.ipv4.tcp_keepalive_probes=3

   insmod /home/as-iosched.ko
   echo "anticipatory" > /sys/block/mmcblk0/queue/scheduler
   echo "1024" > /sys/block/mmcblk0/queue/read_ahead_kb

   umount /home/hd1
   umount /home/hd2

   mount -t vfat /dev/hd1 /home/hd1
   mkdir /home/hd1/record
   mkdir /home/hd1/record_sub
   mount -t vfat /dev/hd2 /home/hd2
   mkdir /home/hd2/record_sub
   rm /home/web/sd/* -rf
   #mount -t vfat /dev/hd1 /home/web/sd

cd /home/3518
./load3518_left -i
/home/detect_ver
himm 0x20050074 0x06802424

cd /home
	./peripheral &
	./dispatch &
	./exnet &
	#./mysystem &

if [ -f "/home/notfirst" ]; then
	if [ -f "/home/wpa_supplicant.conf" ]; then
		echo "wifi connectting"
		/home/monitor_wifi &
		cd /home
	else
		echo "1" > /tmp/waitdump
		echo "1" > /tmp/announce_success
		/home/monitor_dump && rm /tmp/waitdump && /home/monitor_wifi &
		cd /home
	fi
else
	echo "first start"
fi

	cd /home
	./rmm &

while [ 1 -eq 1 ]
do
if [ -f "/tmp/waitdump" ]; then
	echo "do waiting dump"
	sleep 1
else
	break
fi
done

	#cp update /tmp
	#/tmp/update &
	cp update.sh flash_eraseall crcCheck /home/tmpfs

	cd /home/web
	./lighttpd -f ./lighttpd.conf

	cd /home
	./rtspsvr &

	/home/watch_process &

if [ -f "/home/notfirst" ]; then
	echo "start ok!"
else
	echo "1" > /home/notfirst
	echo "first start, auto reboot!"
	reboot
	reboot
fi

sleep 5

himm 0x20050068 0x327c2c
#himm 0x20050068 0x0032562c
himm 0x20050074 0x06802424
himm 0x20050078 0x18ffc001
#himm 0x20050078 0x1effc001
himm 0x20110168 0x10601
himm 0x20110188 0x10601
himm 0x20110184 0x03ff2
himm 0x20030034 0x43
himm 0x200300d0 0x1
himm 0x2003007c 0x1
himm 0x20030040 0x102
himm 0x20030040 0x202
himm 0x20030040 0x302
himm 0x20030048 0x102
himm 0x20030048 0x202
himm 0x20030048 0x302


rm /home/hd1/FSCK*

### configure timezone
echo "GMT-2" > /etc/TZ
ntpd -q -p 0.uk.pool.ntp.org
