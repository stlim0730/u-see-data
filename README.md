# uSeeData
## Instructions

These step-by-step instructions install uSeeData on your local machine.

1. Install Node. https://nodejs.org/
2. Install MongoDB. After installation, make sure `mongod` runs properly. While `mongod` is running, make sure `mongo` runs properly on another terminal window. http://www.mongodb.org/
3. Install Bower. http://bower.io/
4. Clone the code repository. This command will create the project directory:

  ```
  $ git clone https://github.com/stlim0730/u-see-data.git
  ```
5. Go to the project directory.

  ```
  $ cd u-see-data
  ```
6. Install node package dependencies. This command will install all the required dependencies.

  ```
  $ npm install
  ```
7. Install bower package dependencies (only Polymer for now).

  ```
  $ bower install
  ```
8. Run mongodb server.

  ```
  $ mongod
  ```
9. While `mongod` is running, run uSeeData server on another terminal window.

  ```
  $ npm start
  ```
10. Connect to the server on your web browser. [http://localhost:18320](http://localhost:18320)
