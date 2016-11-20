#!/bin/bash

prefix=/home/trahay/Documents/prive/maison/chauffage/serveur
zone_dir=$prefix/zones
program_sem_dir=$prefix/program_sem
program_dir=$prefix/program

function get_field {
    field=$1
    file=$2
    grep $field $file |sed 's/^'$field'=//'
}

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

function get_program_from_sem {
    program_sem=$1
    jour=$(get_cur_day)
    program_file=$program_sem_dir/$program_sem
    get_field Program_$jour $program_file
}

function get_cur_mode {
    program_sem=$1
    get_program_from_sem $program_sem
}

function set_program {
    program_sem=$1
    pin1=$2
    pin2=$3

    mode=$(get_cur_mode $program_sem)
    echo "Setting mode $mode to pins $pin1 $pin2"
}

for zone in $zone_dir/* ; do
    echo $zone
    zone_name=$(get_field Zone_Name $zone)
    zone_pin1=$(get_field PIN1 $zone)
    zone_pin2=$(get_field PIN2 $zone)
    zone_program=$(get_field Program $zone)
    echo "$zone_name $zone_pin1 $zone_pin2 $zone_program"
    set_program $zone_program $zone_pin1 $zone_pin2
done
