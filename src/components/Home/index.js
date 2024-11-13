import {Component} from 'react'
import {v4} from 'uuid'
import {RiDeleteBin6Line} from 'react-icons/ri'
import {MdEdit} from 'react-icons/md'
import {
  MainContainer,
  CreateTaskDiv,
  CreateForm,
  FormHeading,
  LabelInputDiv,
  Label,
  Input,
  FormBtn,
  AddTaskDiv,
  MainHeading,
  TaskUl,
  TaskListLi,
  TaskText,
  NoTaskText,
} from './styledComponents'

const statusList = [
  {text: 'DONE'},
  {text: 'PENDING'},
  {text: 'IN PROGRESS'},
  {text: 'COMPLETED'},
]

class Home extends Component {
  state = {
    activeStatus: statusList[1],
    inputText: '',
    taskList: [],
    isEdit: false,
    item: '',
    editNow: false,
    activeText: '',
  }

  onBlurEdit = () => {
    const {activeText} = this.state
    if (activeText === '') {
      this.setState(prevState => ({
        taskList: prevState.taskList.map(each => {
          if (each.id === id) {
            return {...each, task: activeText}
          }
          return each
        }),
      }))
    }
    this.setState(prevState => ({
      editNow: !prevState.editNow,
    }))
  }

  onChangeEdit = event => {
    this.setState({inputText: event.target.value})
  }

  onConvertEditOption = () => {
    this.setState(prevState => ({editNow: !prevState.editNow}))
  }

  changeInput = event => {
    this.setState({inputText: event.target.value})
  }

  submitForm = event => {
    event.preventDefault()
    const {inputText} = this.state
    const newTask = {
      id: v4(),
      task: inputText,
    }

    if (inputText.length !== 0) {
      this.setState(prevState => ({
        taskList: [...prevState.taskList, newTask],
        inputText: '',
      }))
    }
  }

  renderCreateTaskView = () => {
    const {inputText} = this.state
    return (
      <CreateTaskDiv>
        <CreateForm onSubmit={this.submitForm}>
          <FormHeading>TODO</FormHeading>
          <LabelInputDiv>
            <Label htmlFor='inputText'>Task</Label>
            <Input
              type='text'
              placeholder='Enter the task here'
              onChange={this.changeInput}
              value={inputText}
              id='inputText'
            />
          </LabelInputDiv>
          <FormBtn type='submit'>Add Task</FormBtn>
        </CreateForm>
      </CreateTaskDiv>
    )
  }

  renderTaskCard = () => {
    const {taskList} = this.state
    const onDeleteTodo = each => {
      const filteredTaskList = taskList.filter(item => item !== each)
      this.setState({taskList: filteredTaskList})
    }

    return (
      <>
        {taskList.map(each => (
          <TaskListLi key={each.id}>
            <TaskText>{each.task}</TaskText>
            <button type='button' onClick={() => onDeleteTodo(each)}>
              <RiDeleteBin6Line />
            </button>
            <button type='button' onClick={this.onConvertEditOption}>
              <MdEdit />
            </button>
            <select>
              {statusList.map(eachStatus => (
                <option>{eachStatus.text}</option>
              ))}
            </select>
          </TaskListLi>
        ))}
      </>
    )
  }

  renderAddTaskView = () => {
    const {taskList} = this.state

    return (
      <AddTaskDiv>
        <MainHeading>Tasks</MainHeading>
        <TaskUl>
          {taskList.length === 0 ? (
            <NoTaskText>No Tasks Added Yet</NoTaskText>
          ) : (
            this.renderTaskCard()
          )}
        </TaskUl>
      </AddTaskDiv>
    )
  }

  render() {
    return (
      <MainContainer>
        {this.renderCreateTaskView()}
        {this.renderAddTaskView()}
      </MainContainer>
    )
  }
}

export default Home
