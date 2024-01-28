let x = [
    {
        index: 0,
        message: {
            role: 'assistant',
            content: 'aaa'
        },
        logprobs: null,
        finish_reason: 'stop'
    }
]
console.log(x[0].message.content)