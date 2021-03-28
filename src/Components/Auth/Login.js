import React from 'react'
import { Grid, Form, Segment, Button, Header, Message, Icon, Loader } from 'semantic-ui-react'
import { Link } from 'react-router-dom'
import firebase from '../../firebase'

class Login extends React.Component {
  state = {
    email: "",
    password: "",
    errors: [],
    loading: false,
  }

  handleChange = e => {
    this.setState({[e.target.name]: e.target.value})
  }

  displayErrors = () => this.state.errors.map((error, i) => <p key={i}>{error.message}</p>)

  handleSubmit = e => {
    e.preventDefault()
    if (!this.isFormValid(this.state)) return
    this.setState({ errors: [], loading: true })
    firebase
      .auth()
      .signInWithEmailAndPassword(this.state.email, this.state.password)
      .then(signedInuser => {
        console.log(signedInuser)
        this.setState({loading: false})
      })
      .catch(err => {
        console.log(err)
        this.setState({ errors: this.state.errors.concat(err), loading: false })
      })
      
  }

  isFormValid = ({email, password}) => email && password

  render() {

    //destructuring
    const { email, password, errors, loading } = this.state

    return (
      <Grid textAlign="center" verticalAlign="middle" className="app">
        <Grid.Column style={{ maxWidth: 450 }}>
          <Header as="h1" icon color="violet" textAlign="center">
            <Icon name="code branch" color="violet" />
            Login to Slack
          </Header>
          <Form onSubmit={this.handleSubmit} size="large">
            <Segment stacked>
              <Form.Input fluid name="email" icon="mail" iconPosition="left"
                placeholder="Email Address" value={email} onChange={this.handleChange} type="email" />
              <Form.Input fluid name="password" icon="lock" iconPosition="left"
                placeholder="Password" value={password} onChange={this.handleChange} type="password" />
              <Button disabled={loading} color="violet" fluid size="large">
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
          <Message>Don't have an account? <Link to="/register">Register</Link></Message>
        </Grid.Column>
      </Grid>
    )
  }
}

export default Login