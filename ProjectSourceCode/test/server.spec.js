// ********************** Initialize server **********************************


const server = require('../src/index.js'); //TODO: Make sure the path to your index.js is correctly added


// ********************** Import Libraries ***********************************

const chai = require('chai'); // Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const {assert, expect} = chai;

// ********************** DEFAULT WELCOME TESTCASE ****************************

describe('Server!', () => {
  // Sample test case given to test / endpoint.
  it('Returns the default welcome message', done => {

    console.log("IN UNIT TEST ***************");
    chai
      .request(server)
      .get('/welcome')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.status).to.equals('success');
        assert.strictEqual(res.body.message, 'Welcome!');
        done();
      });
  });
});


// *********************** TODO: WRITE 2 UNIT TEST CASES **************************
describe('Testing Add User API', () => {

})
//We are checking POST /add_user API by passing the user info in in incorrect manner (name cannot be an integer). This test case should pass and return a status 400 along with a "Invalid input" message.

describe('Testing Add User API', () => {
    it('positive: /register testing for successful regestration', done => {
        chai
        .request(server)
        .post('/register')
        .send({username: 'John Doe', password: 'password'})
        .end((err, res) => {
          res.should.have.status(200);
          res.should.redirectTo(/^.*127\.0\.0\.1.*\/login$/);
            done();
          });
    })
  
    // Example Negative Testcase :
    // API: /add_user
    // Input: {id: 5, name: 10, dob: '2020-02-20'}
    // Expect: res.status == 400 and res.body.message == 'Invalid input'
    // Result: This test case should pass and return a status 400 along with a "Invalid input" message.
    // Explanation: The testcase will call the /add_user API with the following invalid inputs
    // and expects the API to return a status of 400 along with the "Invalid input" message.
    it('Negative : /register. Checking invalid username', done => {
      chai
        .request(server)
        .post('/register')
        .send({username: ' ', password: 'password'})
        .end((err, res) => {
          res.should.have.status(400);
          done();
        });
    });
});
// ********************************************************************************


// *********************** UNIT TEST CASE FOR Login **************************
describe('Testing Login', () => {
  it('positive: /login checking for successful login', done => {
      chai
      .request(server)
      .post('/login')
      .send({username: 'admin', password: 'admin'})
      .end((err, res) => {
          res.should.have.status(200);
          res.should.redirectTo(/^.*127\.0\.0\.1.*\/homeCanvas$/);

          done();
        });
  })

  // Example Negative Testcase :
  // API: /add_user
  // Input: {id: 5, name: 10, dob: '2020-02-20'}
  // Expect: res.status == 400 and res.body.message == 'Invalid input'
  // Result: This test case should pass and return a status 400 along with a "Invalid input" message.
  // Explanation: The testcase will call the /add_user API with the following invalid inputs
  // and expects the API to return a status of 400 along with the "Invalid input" message.
  it('Negative : /login. Checking for valid username but invalid password', done => {
    chai
      .request(server)
      .post('/login')
      .send({username: 'admin', password: 'password'})
      .end((err, res) => {
        res.should.have.status(400);
        done();
      });
  });
});

// ********************************************************************************