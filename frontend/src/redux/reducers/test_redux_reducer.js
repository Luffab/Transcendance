
const data = [
    {
        name:"0",
        email:"email0.com",
        phone:"0",
        category:"business"
    },
    {
        name:"1",
        email:"email01.com",
        phone:"1",
        category:"friends"
    },
    {
        name:"2",
        email:"email2.com",
        phone:"2",
        category:"family"
    },
    {
        name:"3",
        email:"email3.com",
        phone:"3",
        category:"business"
    },
]

const initialState = {
    items: data,
    placeholders: [],
    error: null,
    loading: false,
}

function reducer(state = initialState, {type, payload}) {
    switch (type) {
        case ADD_CONTACT:
            const newContact = {
                ...payload,
                id:state.items.length + 1,
                name: `${payload.first?.capitalize()} ${payload.last?.capitalize()}`
            }
            return {
                ...state,
                items: [newContact, ...state.items],
                placeholders: [newContact, ...state.items],
            }
        default:
            return state
    }
}