import sqlite3;
import pprint;
import datetime;
import requests;
import sys;

weekday=datetime.datetime.today().weekday();
db=sqlite3.connect(sys.argv[1]);
cursor=db.cursor();

# The web framework gets post_id from the URL and passes it as a string
def get_program_semaine(id):
    cursor.execute("select * from programme_semaine where id="+str(id));
    p=cursor.fetchone();
    print(p);
    result={};
    result['id'] = p[0];
    result['name'] = p[1];
    result['program']=[None]*7;
    result['program'][0] = p[2];
    result['program'][1] = p[3];
    result['program'][2] = p[4];
    result['program'][3] = p[5];
    result['program'][4] = p[6];
    result['program'][5] = p[7];
    result['program'][6] = p[8];
    return result;

def get_zone(id):
    cursor.execute("select * from zones where id="+str(id));
    p=cursor.fetchone();
    result={};
    result['id'] = p[0];
    result['name'] = p[1];
    result['url'] = p[2];
    result['program'] = p[3];
    return result;

def get_program_journee(id):
    cursor.execute("select * from programme_journee where id="+str(id));
    p=cursor.fetchone();
    result={};
    result['id'] = p[0];
    result['name'] = p[1];
    result['program'] = p[2];
    return result;

def get_hour_index():
    hour= datetime.datetime.now().hour;
    minute= datetime.datetime.now().minute;
    return minute/15+4*hour;    

def get_current_mode(url):
    response=requests.get(url)
    return response.json()

def set_mode(url, name, mode):
    response = requests.put(url, json={name:mode});
    return response

def mode(int_mode):
    if int_mode == 0:
        return "A"
    if int_mode == 1:
        return "H"
    if int_mode == 2:
        return "E"
    if int_mode == 3:
        return "C"
    return ""


cursor_zone=db.cursor();
cursor_zone.execute("select * from zones");
for zone in cursor_zone:
    z={};
    z['id'] = zone[0];
    z['name'] = zone[1];
    z['url'] = zone[2];
    z['program'] = zone[3];

    zone_name=z['name'];
    zone_url=z['url'];      # full url (eg. http://192.168.0.10/fp3)
    zone_url_name=zone_url.split("/")[-1]; # last token (eg. fp3)
    zone_base_url="/".join(zone_url.split("/")[:-1]); # base url (eg. http://192.168.0.10 )
    print(zone_url_name);
    zone_id=zone_url_name[-1];                        # id (eg. 3)
        
    zone_program=z['program']; 
    program=get_program_semaine(zone_program);
    program_journee=get_program_journee(program['program'][weekday]);

    cur_program=program_journee['program'][get_hour_index()]; # program to apply

    current_mode=get_current_mode(zone_url); # program currently in use

    m = mode(int(cur_program));
    req_url=zone_base_url+"?setfp="+zone_id+m;

    print("Setting zone "+zone_name+" to mode '"+m+ "'\tfull url: "+req_url);
    
    response=get_current_mode(req_url);
    if response['response'] == 0:
        print("\tOK")
    else:
        print(response)



db.close
