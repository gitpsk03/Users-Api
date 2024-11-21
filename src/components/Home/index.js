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
    inputText: '',
    taskList: [],
    editActive: false,
    activeId: '',
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

  editedSubmitForm = event => {
    event.preventDefault()
    const {inputText, activeId} = this.state
    this.setState(prevState => ({
      taskList: prevState.taskList.map(each => {
        if (each.id === activeId) {
          return {...each, task: inputText}
        }
        return each
      }),
      inputText: '',
      editActive: false,
      activeId: '',
    }))
  }

  renderCreateTaskView = () => {
    const {inputText, editActive} = this.state
    return (
      <CreateTaskDiv>
        {editActive ? (
          <CreateForm onSubmit={this.editedSubmitForm}>
            <FormHeading>TODO</FormHeading>
            <LabelInputDiv>
              <Label htmlFor="inputText">Task</Label>
              <Input
                type="text"
                placeholder="Enter the task here"
                onChange={this.changeInput}
                value={inputText}
                id="inputText"
              />
            </LabelInputDiv>
            <FormBtn type="submit">Ok</FormBtn>
          </CreateForm>
        ) : (
          <CreateForm onSubmit={this.submitForm}>
            <FormHeading>TODO</FormHeading>
            <LabelInputDiv>
              <Label htmlFor="inputText">Task</Label>
              <Input
                type="text"
                placeholder="Enter the task here"
                onChange={this.changeInput}
                value={inputText}
                id="inputText"
              />
            </LabelInputDiv>
            <FormBtn type="submit">Add Task</FormBtn>
          </CreateForm>
        )}
      </CreateTaskDiv>
    )
  }

  renderTaskCard = () => {
    const {taskList} = this.state
    const onDeleteTodo = each => {
      const filteredTaskList = taskList.filter(item => item !== each)
      this.setState({
        taskList: filteredTaskList,
        inputText: '',
        editActive: false,
        activeId: '',
      })
    }
    const onClickEdit = each => {
      this.setState({
        editActive: true,
        activeId: each.id,
        inputText: each.task,
      })
    }

    return (
      <>
        {taskList.map(each => (
          <TaskListLi key={each.id}>
            <TaskText>{each.task}</TaskText>
            <button type="button" onClick={() => onDeleteTodo(each)}>
              <RiDeleteBin6Line />
            </button>
            <button type="button" onClick={() => onClickEdit(each)}>
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
