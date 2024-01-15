Learning node.js and stuff


Next up:
    - Lesson 5: https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/Displaying_data
    
URLs:
    - Load balanced URL: 
        - https://nodejs.epa.bdsys.net/ (local 3000)
        - http://nodejs.epa.bdsys.net/ (local 8000)
    
    - Server host name (not load balanced):
        - ec2-3-19-229-12.us-east-2.compute.amazonaws.com
    
    
Notes:

    - How to start express-generator generated app "helloworld" on web server:
    
        # Run helloworld on Linux/macOS
        # NOTE: Must be in the "helloworld" folder. 
        # Othewise, you need to add the pathing context from the current directory
        #DEBUG=helloworld:* npm start
	# Nodemon method
	DEBUG=express-locallibrary-tutorial:* npm run devstart


Git commands:
   - Essential Git commands:

	git add . # Adds modified files to the stage
	git status # Prints the staged files to the screen
	git commit -a # Prepares to commit the staged files. Opens a nano editor for preview and commentary.
	git push # Pushes the comitted branch to the remote repo (CodeCommit, in this case)
	# OR use below if...
	git push --set-upstream origin < branch name > # Use this if you created a branch locally that isn't yet instantiated remotely 
	git checkout master # Checks out master from the local repo
	git status # Checks local repo and diffs against remote
	git pull # Pulls remote master branch
	git merge < branch > # Merges < branch > into master
	git push # Pushes local master up to repo
	git checkout -b < branch name > # Creates a branch from master and checks it out locally


Server side:

	- Install AWS X-Ray daemon:
		- Note: See userdata.sh script in root of project
		- curl https://s3.us-east-2.amazonaws.com/aws-xray-assets.us-east-2/xray-daemon/aws-xray-daemon-3.x.deb -o /home/ssm-user/xray.deb
		- sudo apt install /home/ssm-user/xray.deb (or ./xray.deb if in the right directory)

	- Start/stop/restart AWS X-Ray service
		- sudo systemctl start xray
		- sudo systemctl stop xray
		- sudo systemctl restart xray
	
	- Enable AWS X-Ray to start on boot
		- sudo systemctl enable xray

	- Install New Relic infrastructure agent for EC2
		- Copy and paste the script located at ./newrelic-install.txt

	- Print console messages:
		- console.error( < Insert error stuff here > );

	- Debug namespaces:
		- DEBUG=express-locallibrary-tutorial:* npm run devstart
		- DEBUG=express:* npm run devstart

	- Keep app.js running in the background for unattended server run
	- NOTE: This does not run nodemon or show debug logs!
	- NOTE: This users "forever"
		- Install forever globally: sudo npm install forever -g
		- Optional install for programmatic use: sudo npm install forever-monitor
		- forever start --minUptime 1000 --spinSleepTime 1000 ./bin/www
	- NOTE: Better alternatives:
		- https://pm2.keymetrics.io/
		- https://github.com/remy/nodemon#nodemon
