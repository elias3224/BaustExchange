@echo off
cd /d E:\Level 3 Term I\BaustExchange
npx tsc --noEmit > tsc_out.txt 2>&1
echo EXITCODE:%ERRORLEVEL% >> tsc_out.txt
echo done
