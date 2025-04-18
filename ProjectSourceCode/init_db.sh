#!/bin/bash
# DO NOT PUSH THIS FILE TO GITHUB
# This file contains sensitive information and should be kept private
PG_URI='postgresql://users_db_pwim_user:6MSS8GiMz360nQ2MWcbGPbKnA6n7yyar@dpg-cvvvafl6ubrc73akjuig-a.virginia-postgres.render.com/users_db_pwim'
# Execute each .sql file in the directory
for file in src/init_data/*.sql; do
    echo "Executing $file..."
    psql $PG_URI -f "$file"
done