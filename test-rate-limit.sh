#!/bin/bash
for i in {1..105}
do
   status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/)
   echo "Request $i: $status"
   if [ "$status" -eq 429 ]; then
       echo "Rate limit hit at request $i"
       break
   fi
done
