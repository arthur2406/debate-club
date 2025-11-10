import { Box, Heading, Stack, Text, useColorModeValue } from '@chakra-ui/react'

interface TopicCardProps {
  topic: string
  description?: string
  isSelected?: boolean
  onSelect?: () => void
}

const TopicCard = ({ topic, description, isSelected, onSelect }: TopicCardProps) => {
  const bg = useColorModeValue('white', 'gray.700')
  const borderColor = useColorModeValue('teal.200', 'teal.400')

  return (
    <Box
      as="button"
      onClick={onSelect}
      borderWidth="2px"
      borderColor={isSelected ? borderColor : 'transparent'}
      boxShadow="md"
      borderRadius="lg"
      p={6}
      bg={bg}
      cursor="pointer"
      textAlign="left"
      transition="transform 0.2s ease, box-shadow 0.2s ease"
      _hover={{ transform: 'translateY(-4px)', boxShadow: 'xl' }}
      _focus={{ boxShadow: 'outline' }}
    >
      <Stack spacing={3}>
        <Heading size="md">{topic}</Heading>
        {description ? (
          <Text color="gray.500" fontSize="sm">
            {description}
          </Text>
        ) : null}
      </Stack>
    </Box>
  )
}

export default TopicCard
