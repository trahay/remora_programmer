from pymongo import MongoClient;
import pprint;
from bson.objectid import ObjectId;
import datetime;
import requests;

weekday=datetime.datetime.today().weekday();
client = MongoClient('mongodb://localhost/');
db=client.chauffage;
programme_semaine = db.programme_semaine;
programme_journee = db.programme_journee;
zones = db.zones;

# The web framework gets post_id from the URL and passes it as a string
def get_program_semaine(id):
    # Convert from string to ObjectId:
    return programme_semaine.find_one({'_id': ObjectId(id)})
def get_zone(id):
    # Convert from string to ObjectId:
    return zones.find_one({'_id': ObjectId(id)})
def get_program_journee(id):
    # Convert from string to ObjectId:
    return programme_journee.find_one({'_id': ObjectId(id)})

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

for z in zones.find():
    try:
        zone_name=z['name'];
        zone_url=z['url'];      # full url (eg. http://192.168.0.10/fp3)
        zone_url_name=zone_url.split("/")[-1]; # last token (eg. fp3)
        zone_base_url="/".join(zone_url.split("/")[:-1]); # base url (eg. http://192.168.0.10 )
        zone_id=zone_url_name[-1];                        # id (eg. 3)
        
        zone_program=z['program']; 
        program=get_program_semaine(zone_program);
        program_journee=get_program_journee(program['program'][weekday]);

        cur_program=program_journee['program'][get_hour_index()]; # program to apply

        current_mode=get_current_mode(zone_url); # program currently in use

        m = mode(cur_program);

        req_url=zone_base_url+"?setfp="+zone_id+mode(cur_program);

        print("Setting zone "+zone_name+" to mode "+m+ "\tfull url: "+req_url);

        response=get_current_mode(req_url);
        if response['response'] == 0:
            print("\tOK")
        else:
            print("\tKO")
    except:
        print("An error occured !");

