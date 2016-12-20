#!/bin/bash

prefix=/home/trahay/Documents/prive/maison/chauffage/serveur
zone_dir=$prefix/zones
program_sem_dir=$prefix/program_sem
program_dir=$prefix/programs
log_file=$prefix/logs/cron.log
paje_trace_file=$prefix/logs/chauffage.trace

# send a value to two pins
function set_value {
    pin1=$1
    pin2=$2
    value=$3
    echo "Setting pins ($pin1,$pin2) to $value"
}

function get_field {
    field=$1
    file=$2
    grep "^$field=" $file |sed 's/^'$field'=//'
}

# print the hour
function get_cur_hour {
    hour=$(date "+%H %M")
    h=$(echo $hour |cut -d" " -f1)
    m=$(echo $hour |cut -d" " -f2)
    echo "($h*4+($m/15))+1"|bc
}

# print the day
function get_cur_day {
    day=$(date "+%w")
    case $day in
	0) jour=dimanche;;
	1) jour=lundi;;
	2) jour=mardi;;
	3) jour=mercredi;;
	4) jour=jeudi;;
	5) jour=vendredi;;
	6) jour=samedi;;
	*)
	    echo "Incorrect day $day" >&2
	    exit 1
    esac
    echo $jour
}

# print the current program from a program_sem
function get_program_from_sem {
    program_sem=$1
    jour=$(get_cur_day)
    program_file=$program_sem_dir/$program_sem
    get_field Program_$jour $program_file
}

# print the current_mode from a program
function get_cur_mode_from_day {
    program=$1
    hour=$(get_cur_hour)
    program_file=$program_dir/$program
    prog=$(get_field Program $program_file)
    cur_prog=$(echo $prog|cut -c$hour)
    echo $cur_prog
}


# print the current mode from a program_sem
function get_cur_mode_from_program {
    program_sem=$1

    mode=$(get_program_from_sem $program_sem)
# get the current mode (stop, eco, confort, ...)
    cur_mode=$(get_cur_mode_from_day $mode)
    echo $cur_mode
}

function log_paje {
    zone_name=$1
    cur_mode=$2
    d=$(date "+%s")
    d=$(($d - 1482252008))
    date_complete=$(date)
    echo "20 $d \"E_event\" \"$zone_name\" \"$date_complete\"" >> $paje_trace_file
    echo "11 $d \"ST_Radiateur\" \"$zone_name\" \"STV_${cur_mode}\"" >> $paje_trace_file
}

# set the appropriate program for a zone
function update_program_for_zone {
    zone=$1
    zone_name=$(get_field Zone_Name $zone)
    zone_pin1=$(get_field PIN1 $zone)
    zone_pin2=$(get_field PIN2 $zone)
    zone_program=$(get_field Program $zone)
    cur_mode=$(get_cur_mode_from_program $zone_program)
    cur_hour=$(get_cur_hour)
    echo "Setting zone $zone_name to $cur_mode (cur_hour=$cur_hour)"
    d=$(date)
    echo "[$d] Setting zone $zone_name to $cur_mode" >> $log_file
    log_paje $zone_name $cur_mode
    set_value $zone_pin1 $zone_pin2 $cur_mode
    echo ""
}

for zone in $zone_dir/* ; do
    update_program_for_zone $zone
done
