from pymongo import MongoClient;
import pprint;
from bson.objectid import ObjectId
import datetime

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
    
for z in zones.find():
    try:
        zone_name=z['name'];
        zone_url=z['url'];
        zone_program=z['program']; 
        program=get_program_semaine(zone_program);
        program_journee=get_program_journee(program['program'][weekday]);
        cur_program=program_journee['program'][get_hour_index()];
        print("name:"+zone_name+"  url:"+zone_url+" program:"+program_journee['name']+"  cur_program:"+str(cur_program));
    except:
        print("An error occured !");
