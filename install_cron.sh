#!/bin/bash


full_path="$PWD/$0"
prefix=$(dirname $full_path)

script_path="python $prefix/scripts/cron_script.py $prefix/db_chauffage.db >> $prefix/logs/cron.log"
(crontab -l 2>/dev/null; echo "*/5 * * * * $script_path ") | crontab -
