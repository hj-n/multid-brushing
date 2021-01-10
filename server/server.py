import json

from flask import Flask, request, jsonify
from flask_cors import CORS
from pathlib import Path

app = Flask(__name__)
CORS(app)

## Global Variables 
DENSITY = None
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
    global DENSITY

    dataset, method, sample = parseArgs(request) 
    ## If no such dataset 
    path = dataset + "/" + method + "/" + sample
    if not Path("./json/" + path + "/snn_density.json").exists():
        return "failed", 400

    if (CURRENT_PATH == path):
        return "success", 200
    else:
        density_file = open("./json/" + path + "/snn_density.json")
        DENSITY = json.load(density_file)
        CURRENT_PATH = "path"
    return "success", 200

@app.route('/density')
def density():
    global CURRENT_PATH
    global DENSITY
    if checkPath(request, CURRENT_PATH):
        return "failed", 400

    return jsonify(DENSITY)
    


if __name__ == '__main__':
    app.run()