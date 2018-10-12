#!/bin/bash

sqlite3 db_chauffage.db <<EOF
create table zones(
    id integer primary key,
    name text,
    program integer);


create table programme_semaine(
    id integer primary key,
    name text,
    program_0 integer,
    program_1 integer,
    program_2 integer,
    program_3 integer,
    program_4 integer,
    program_5 integer,
    program_6 integer);

create table programme_journee(
    id integer primary key,
    name text,
    program integer);

EOF

