#!/bin/bash

sqlite3 db_chauffage.db <<EOF
create table zones(
    id integer primary key,
    name text,
    url	 text,
    program integer);


create table programme_semaine(
    id integer primary key,
    name text,
    prog_0 integer,
    prog_1 integer,
    prog_2 integer,
    prog_3 integer,
    prog_4 integer,
    prog_5 integer,
    prog_6 integer);

create table programme_journee(
    id integer primary key,
    name text,
    program text);

EOF

