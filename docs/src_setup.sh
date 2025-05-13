#!/bin/bash

cd /workspaces/mlops-demo/src
pip install --upgrade pip setuptools wheel\
	    && pip install -e ".[dev]"
