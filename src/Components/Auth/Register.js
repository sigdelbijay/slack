import React from 'react'
import { Grid, Form, Segment, Button, Header, Message, Icon, Dimmer, Loader } from 'semantic-ui-react'
import { Link } from 'react-router-dom'
import firebase from '../../firebase'
import md5 from 'md5'

class Register extends React.Component {
  state = {
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    errors: [],
    loading: false,
    usersRef: firebase.database().ref("users")
  }

  handleChange = e => {
    this.setState({[e.target.name]: e.target.value})
  }

  isFormValid = () => {
    let errors = []
    let error
    if (this.isFormEmpty()) {
      //throw err
      error = { message: "Fill in all the fields" }
      this.setState({ errors: errors.concat(error) })
      return false;
    } else if (!this.isPasswordValid()) {
      //throw err
      error = { message: "Password is invalid" }
      this.setState({ errors: errors.concat(error) })
      return false;
    } else {
      return true
    }
  }

  isFormEmpty = () => {
    const { username, email, password, confirmPassword } = this.state
    return !username.length || !email.length || !password.length || !confirmPassword.length
  }

  isPasswordValid = () => {
    const { password, confirmPassword } = this.state
    if (password.length < 6 || confirmPassword.length < 6) return false
    else if (password !== confirmPassword) return false
    else return true
  }

  displayErrors = () => this.state.errors.map((error, i) => <p key={i}>{error.message}</p>)

  saveUser = createdUser => {
    return this.state.usersRef.child(createdUser.user.uid).set({
      name: createdUser.user.displayName,
      avatar: createdUser.user.photoURL
    })
  }

  handleSubmit = e => {
    if (!this.isFormValid()) return
    this.setState({errors: [], loading: true})
    e.preventDefault()
      firebase
        .auth()
        .createUserWithEmailAndPassword(this.state.email, this.state.password)
        .then(createdUser => {
          console.log(createdUser)
          createdUser.user.
            updateProfile({
              displayName: this.state.username,
              photoURL: `http://gravatar.com/avatar/${md5(createdUser.user.email)}?d=identicon`
            })
            .then(() => {
              this.saveUser(createdUser).then(() => {
                console.log('user saved')
              })
            })
            .catch(err => {
              console.log(err)
              this.setState({errors: this.state.errors.concat(err), loading: false})
            })

        })
        .catch(err => {
          console.log(err)
          this.setState({errors: this.state.errors.concat(err), loading: false})
        })
  }

  render() {

    //destructuring
    const { username, email, password, confirmPassword, errors, loading } = this.state

    return (
      <Grid textAlign="center" verticalAlign="middle" className="app">
        <Grid.Column style={{ maxWidth: 450 }}>
          <Header as="h1" icon color="orange" textAlign="center">
            <Icon name="puzzle piece" color="orange" />
            Register for Slack
          </Header>
          <Form onSubmit={this.handleSubmit} size="large">
            <Segment stacked>
              <Form.Input fluid name="username" icon="user" iconPosition="left"
                placeholder="Username" value={username} onChange={this.handleChange} type="text" />
              <Form.Input fluid name="email" icon="mail" iconPosition="left"
                placeholder="Email Address" value={email} onChange={this.handleChange} type="email" />
              <Form.Input fluid name="password" icon="lock" iconPosition="left"
                placeholder="Password" value={password} onChange={this.handleChange} type="password" />
              <Form.Input fluid name="confirmPassword" icon="repeat" iconPosition="left"
                placeholder="Confirm Password" value={confirmPassword} onChange={this.handleChange} type="password" />
              <Button disabled={loading} color="orange" fluid size="large">
                {loading ? <Loader active inline='centered' size="mini"/> : 'Submit'}
                </Button>
            </Segment>
          </Form>
          {errors.length > 0 && (
            <Message error>
              <h3>Error</h3>
              {this.displayErrors()}
            </Message>
          )}
          <Message>Already a user? <Link to="/login">Login</Link></Message>
        </Grid.Column>
      </Grid>
    )
  }
}

export default Register