import Image from 'next/image'

const Footer = () => {
  return (
    <footer className='flex items-center justify-center gap-x-1 py-3'>
        <Image src={'/logo.webp'} width={25} height={25} alt='logo' loading='lazy' />
        <p className='text-lg font-bold text-violet-900'>Styles Dispatch EG</p>
    </footer>
  )
}

export default Footer