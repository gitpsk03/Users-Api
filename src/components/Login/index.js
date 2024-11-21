import {Component} from 'react'
import {
  MainContainer,
  CreateForm,
  Label,
  Input,
  FormBtn,
  FormHeading,
} from './styledComponents'

class Login extends Component {
  render() {
    return (
      <MainContainer>
        <FormHeading>TODO</FormHeading>
        <CreateForm>
          <Label>Username</Label>
          <Input type="text" />
          <Label>Password</Label>
          <Input type="text" />
          <FormBtn type="submit">Login</FormBtn>
        </CreateForm>
      </MainContainer>
    )
  }
}

export default Login
