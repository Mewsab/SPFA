import { Bot, Send, UserRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { sendAIChatMessage } from '../../api/insightApi'

const INITIAL_ASSISTANT_MESSAGE = {
  id: 'initial-coach-message',
  role: 'assistant',
  text: 'Ask me about your spending, savings rate, or suggested budgets.',
}

const QUICK_ACTIONS = [
  'Where am I overspending?',
  'How can I improve my savings rate?',
  'Which category should I reduce first?',
  'Suggest a budget strategy for next month.',
]

function getAIChatErrorMessage(error) {
  if (error.response?.status === 400) {
    return 'Add transactions or upload a CSV statement before using the AI coach.'
  }

  if (error.response?.status === 422) {
    return 'Please enter a valid message.'
  }

  if (error.response?.status === 503) {
    return 'AI coach is currently unavailable. Check API key, credits, or service availability.'
  }

  return 'Could not get a coach response. Please try again.'
}

function createMessage(role, text) {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    text,
  }
}

function AICoachChat({ onUnauthorized }) {
  const [messages, setMessages] = useState([INITIAL_ASSISTANT_MESSAGE])
  const [inputValue, setInputValue] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [disclaimer, setDisclaimer] = useState('')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, isSending])

  const sendMessage = async (messageText = inputValue) => {
    const trimmedMessage = messageText.trim()

    if (!trimmedMessage || isSending) {
      return
    }

    try {
      setIsSending(true)
      setErrorMessage('')
      setDisclaimer('')
      setInputValue('')
      setMessages((current) => [...current, createMessage('user', trimmedMessage)])

      const response = await sendAIChatMessage({
        message: trimmedMessage,
        source: null,
        import_batch_id: null,
        date_from: null,
        date_to: null,
      })

      const coachText = response.data?.response || 'I could not generate a coach response right now.'
      setMessages((current) => [...current, createMessage('assistant', coachText)])
      setDisclaimer(response.data?.disclaimer || '')
    } catch (error) {
      if (error.response?.status === 401) {
        onUnauthorized()
        return
      }

      setErrorMessage(getAIChatErrorMessage(error))
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void sendMessage()
    }
  }

  return (
    <section className="soft-panel px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-cyan-200"
            style={{
              border: '1px solid var(--spfa-border-accent)',
              background: 'var(--spfa-accent)',
            }}
          >
            <Bot size={18} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">AI Financial Coach</h3>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              Ask a question about your spending, savings, or smart budget suggestions.
            </p>
          </div>
        </div>
      </div>

      <div
        className="mt-4 max-h-[320px] space-y-3 overflow-y-auto rounded-lg border p-3"
        style={{ borderColor: 'var(--spfa-border)', background: 'rgba(255, 255, 255, 0.03)' }}
      >
        {messages.map((message) => {
          const isUser = message.role === 'user'

          return (
            <div
              key={message.id}
              className={`flex items-start gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser ? (
                <span
                  className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-cyan-200"
                  style={{ borderColor: 'var(--spfa-border-accent)', background: 'var(--spfa-accent)' }}
                >
                  <Bot size={14} />
                </span>
              ) : null}

              <div
                className={`max-w-[86%] rounded-lg border px-3 py-2 text-sm leading-6 ${
                  isUser ? 'text-cyan-50' : 'text-slate-300'
                }`}
                style={{
                  borderColor: isUser ? 'var(--spfa-border-accent)' : 'var(--spfa-border)',
                  background: isUser ? 'rgba(103, 232, 249, 0.14)' : 'rgba(2, 6, 23, 0.72)',
                }}
              >
                {message.text}
              </div>

              {isUser ? (
                <span
                  className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-cyan-100"
                  style={{ borderColor: 'var(--spfa-border-accent)', background: 'rgba(103, 232, 249, 0.14)' }}
                >
                  <UserRound size={14} />
                </span>
              ) : null}
            </div>
          )
        })}

        {isSending ? (
          <div className="flex items-start gap-2">
            <span
              className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-cyan-200"
              style={{ borderColor: 'var(--spfa-border-accent)', background: 'var(--spfa-accent)' }}
            >
              <Bot size={14} />
            </span>
            <div
              className="rounded-lg border px-3 py-2 text-sm text-slate-300"
              style={{ borderColor: 'var(--spfa-border)', background: 'rgba(15, 17, 23, 0.72)' }}
            >
              Thinking through your summary...
            </div>
          </div>
        ) : null}
        <div ref={messagesEndRef} />
      </div>

      {disclaimer ? (
        <p className="mt-2 text-sm leading-5 text-slate-400">{disclaimer}</p>
      ) : null}

      {errorMessage ? (
        <div
          className="mt-3 rounded-lg border px-4 py-3 text-sm text-slate-200"
          style={{
            borderColor: 'rgba(244, 63, 94, 0.28)',
            background: 'rgba(244, 63, 94, 0.08)',
          }}
        >
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action}
            type="button"
            className="rounded-full border px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:border-cyan-300 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
            style={{ borderColor: 'var(--spfa-border)', background: 'rgba(255, 255, 255, 0.03)' }}
            onClick={() => void sendMessage(action)}
            disabled={isSending}
          >
            {action}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <textarea
          value={inputValue}
          maxLength={500}
          rows={1}
          className="form-input min-h-[44px] resize-none py-2.5"
          placeholder="Ask about your spending or budgeting..."
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className="primary-button gap-2 px-4 py-2.5"
          onClick={() => void sendMessage()}
          disabled={isSending || !inputValue.trim()}
        >
          <Send size={16} />
          <span>{isSending ? 'Sending...' : 'Send'}</span>
        </button>
      </div>
    </section>
  )
}

export default AICoachChat
