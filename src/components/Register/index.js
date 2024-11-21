import {Component} from 'react'
import Cookies from 'js-cookie'
import {
  MainContainer,
  CreateForm,
  Label,
  Input,
  FormBtn,
  FormHeading,
} from './styledComponents'

class Register extends Component {
  state = {
    username: '',
    name: '',
    password: '',
    email: '',
    showSubmitError: false,
    errorMsg: '',
  }

  onSubmitSuccess = jwtToken => {
    const {history} = this.props
    Cookies.set('jwt_token', jwtToken, {expires: 30, path: '/'})
    history.replace('/')
  }

  onSubmitFailure = errorMsg => {
    this.setState({showSubmitError: true, errorMsg})
  }

  onSubmitRegister = async event => {
    event.preventDefault()
    const {username, name, password, email} = this.state
    const userDetails = {username, name, password, email}
    const registerUrl = 'http://localhost:3000/user/'
    const options = {
      method: 'POST',
      body: JSON.stringify(userDetails),
    }
    const response = await fetch(registerUrl, options)
    const data = await response.json()
    if (response.ok === true) {
      this.onSubmitSuccess(data.jwt_token)
    } else {
      this.onSubmitFailure(data.error_msg)
    }
  }

  onGetName = event => {
    this.setState({name: event.target.value})
  }

  onGetUsername = event => {
    this.setState({username: event.target.value})
  }

  onGetPassword = event => {
    this.setState({password: event.target.value})
  }

  onGetEmail = event => {
    this.setState({email: event.target.value})
  }

  render() {
    const {
      name,
      username,
      password,
      email,
      showSubmitError,
      errorMsg,
    } = this.state

    return (
      <MainContainer>
        <FormHeading>TODO</FormHeading>
        <CreateForm onSubmit={this.onSubmitRegister}>
          <Label>Name</Label>
          <Input
            type="text"
            placeholder="name"
            value={name}
            onChange={this.onGetName}
          />
          <Label>Username</Label>
          <Input
            type="text"
            placeholder="username"
            value={username}
            onChange={this.onGetUsername}
          />
          <Label>Email</Label>
          <Input
            type="text"
            placeholder="email"
            value={email}
            onChange={this.onGetEmail}
          />
          <Label>Password</Label>
          <Input
            type="password"
            placeholder="password"
            value={password}
            onChange={this.onGetPassword}
          />
          <FormBtn type="submit">Signup</FormBtn>
          {showSubmitError && <p>*{errorMsg}</p>}
        </CreateForm>
      </MainContainer>
    )
  }
}

export default Register
