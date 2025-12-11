interface ContainerProps {
    children?: React.ReactNode;
    className?: string;
}

const Container: React.FC<ContainerProps> = ({ children, className }) => {
    return (
        <div className={`md:container md:mx-auto p-4 w-full ${className}`}>
            {children}
        </div>
    )
}

export default Container;