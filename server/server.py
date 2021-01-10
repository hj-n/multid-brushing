import json
import numpy as np

from flask import Flask, request, jsonify
from flask_cors import CORS
from pathlib import Path

app = Flask(__name__)
CORS(app)

## Global Variables 
DENSITY = None
SIMILARITY = None
EMB = None
CURRENT_PATH = None



## Helpers
def parseArgs(request):
    dataset = request.args.get('dataset', 'spheres') ## use spheres as default
    method  = request.args.get('method', 'umap')
    sample  = request.args.get('sample', '5')
    return dataset, method, sample

def checkPath(request, cpath):
    dataset, method, sample = parseArgs(request)
    path = dataset + "/" + method + "/" + sample
    if path != cpath:
        return False
    else:
        return True



@app.route('/init')
def init():
    global CURRENT_PATH
    global SIMILARITY
    global DENSITY
    global EMB
    

    dataset, method, sample = parseArgs(request) 
    ## If no such dataset 
    path = dataset + "/" + method + "/" + sample
    if not Path("./json/" + path + "/snn_density.json").exists():
        return "failed", 400

    if (CURRENT_PATH == path):
        return "success", 200
    else:
        density_file = open("./json/" + path + "/snn_density.json")
        similarity_file = open("./json/" + path + "/snn_similarity.json")
        emb_file = open("./json/" + path + "/emb.json")
        DENSITY = json.load(density_file)
        SIMILARITY = json.load(similarity_file)
        EMB = json.load(emb_file)
        CURRENT_PATH = "path"

    return "success", 200

@app.route('/basic')
def density():
    global CURRENT_PATH
    global DENSITY
    global EMB

    if checkPath(request, CURRENT_PATH):
        return "failed", 400

    return jsonify({"density": DENSITY, "emb": EMB})

@app.route('/similarity')
def similarity():
    global SIMILARITY
    index = request.args.get("index")
    list_similarity = SIMILARITY[int(index)]["similarity"]
    list_similarity[int(index)] = 0
    max_similarity = np.max(np.array(list_similarity))

    return {
        "similarity": list_similarity,
        "max": max_similarity
    }
    


if __name__ == '__main__':
    app.run()